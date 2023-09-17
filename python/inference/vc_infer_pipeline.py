import logging
import os
import traceback
from functools import lru_cache
from threading import Lock
from time import time as ttime
from typing import Optional

import faiss
import librosa
import numpy as np
import parselmouth
import pyworld
import torch
import torch.nn.functional as F
import torchcrepe
from faiss import IndexIVFFlat
from scipy import signal
from torch import Tensor

from inference.config import Config
from inference.rmvpe import model_rmvpe

bh, ah = signal.butter(N=5, Wn=48, btype="high", fs=16000)

input_audio_path2wav = {}
PIPELINE_LOCK = Lock()

logger = logging.getLogger(__name__)


@lru_cache(maxsize=128)
def cache_harvest_f0(input_audio_path: str, fs: int, f0max: float, f0min: float, frame_period: float) -> np.ndarray:
    """Extracts the fundamental frequency (F0) from the input audio.

    Args:
        input_audio_path (str): Path to the input audio file.
        fs (int): Sampling frequency.
        f0max (float): Maximum F0 value.
        f0min (float): Minimum F0 value.
        frame_period (float): Frame period for analysis.

    Returns:
        np.ndarray: Extracted F0 values.
    """
    # Retrieve the audio waveform from the given path
    audio = input_audio_path2wav[input_audio_path]
    f0, temporal_position = pyworld.harvest(audio, fs=fs, f0_ceil=f0max, f0_floor=f0min, frame_period=frame_period)

    # Apply stonemask to refine the F0 estimate
    f0: np.ndarray = pyworld.stonemask(audio, f0, temporal_position, fs)
    return f0


def change_rms(data1, sr1, data2, sr2, rate):  # 1是输入音频，2是输出音频,rate是2的占比
    rms1 = librosa.feature.rms(y=data1, frame_length=sr1 // 2 * 2, hop_length=sr1 // 2)  # 每半秒一个点
    rms2 = librosa.feature.rms(y=data2, frame_length=sr2 // 2 * 2, hop_length=sr2 // 2)
    rms1 = torch.from_numpy(rms1)
    rms1 = F.interpolate(rms1.unsqueeze(0), size=data2.shape[0], mode="linear").squeeze()
    rms2 = torch.from_numpy(rms2)
    rms2 = F.interpolate(rms2.unsqueeze(0), size=data2.shape[0], mode="linear").squeeze()
    rms2 = torch.max(rms2, torch.zeros_like(rms2) + 1e-6)
    data2 *= (torch.pow(rms1, torch.tensor(1 - rate)) * torch.pow(rms2, torch.tensor(rate - 1))).numpy()
    return data2


class VC:
    def __init__(self, tgt_sr: int, config: Config):
        self.model_rmvpe = None

        # Configuration parameters
        self.x_pad, self.x_query, self.x_center, self.x_max = (
            config.x_pad,
            config.x_query,
            config.x_center,
            config.x_max,
        )

        # Constants
        self.sr = 16000  # Sampling rate for Hubert input
        self.window = 160  # Number of points per frame

        # Time padding and thresholds
        self.t_pad = self.sr * self.x_pad  # Padding time for each item (front and back)
        self.t_pad_tgt = tgt_sr * self.x_pad  # Target padding time
        self.t_pad2 = self.t_pad * 2  # Total padding time
        self.t_query = self.sr * self.x_query  # Query cut point (front and back) time
        self.t_center = self.sr * self.x_center  # Query cut point position
        self.t_max = self.sr * self.x_max  # Duration threshold for query-free processing

        # Device configuration
        self.device = config.device

    def get_optimal_torch_device(self, index: int = 0) -> torch.device:
        return torch.device(self.device)

    # Fork Feature: Compute f0 with the crepe method

    def get_f0_crepe_computation(
        self,
        x: np.ndarray,
        f0_min: float,
        f0_max: float,
        p_len: int,
        hop_length: int = 160,
        model: str = "full",
    ) -> np.ndarray:
        # Convert to float32 to avoid exception, and normalize
        x = x.astype(np.float32)
        x /= np.quantile(np.abs(x), 0.999)
        torch_device = self.get_optimal_torch_device()
        audio = torch.from_numpy(x).to(torch_device, copy=True).unsqueeze(dim=0)
        if audio.ndim == 2 and audio.shape[0] > 1:
            audio = torch.mean(audio, dim=0, keepdim=True).detach()
        audio = audio.detach()
        pitch: Tensor = torchcrepe.predict(
            audio,
            self.sr,
            hop_length,
            f0_min,
            f0_max,
            model,
            batch_size=hop_length * 2,
            device=torch_device,
            pad=True,
        )

        # Resize pitch and convert to final f0
        p_len = p_len or x.shape[0] // hop_length
        source = pitch.squeeze(0).cpu().float().numpy()
        source[source < 0.001] = np.nan
        target = np.interp(
            np.arange(0, len(source) * p_len, len(source)) / p_len,
            np.arange(0, len(source)),
            source,
        )
        f0 = np.nan_to_num(target)
        return f0

    def get_f0_official_crepe_computation(
        self,
        x: np.ndarray,
        f0_min: float,
        f0_max: float,
        model: str = "full",
    ) -> np.ndarray:
        # Batch size for computation; should be chosen based on GPU memory
        batch_size = 512
        # Compute pitch using first gpu
        torch_device = self.get_optimal_torch_device()
        audio = torch.tensor(np.copy(x))[None].float()

        # Compute pitch and periodicity using torchcrepe
        f0, pd = torchcrepe.predict(
            audio,
            self.sr,
            self.window,
            f0_min,
            f0_max,
            model,
            batch_size=batch_size,
            device=torch_device,
            return_periodicity=True,
        )

        # Apply median and mean filters
        pd = torchcrepe.filter.median(pd, 3)
        f0 = torchcrepe.filter.mean(f0, 3)

        # Zero out f0 values where periodicity is low
        f0[pd < 0.1] = 0

        # Return f0 as a numpy array
        return f0[0].cpu().numpy()

    def get_f0_cached(
        self,
        input_audio_path,
        x,
        p_len,
        f0_up_key,
        f0_method,
        filter_radius,
        crepe_hop_length,
        inp_f0=None,
    ):
        # Construct cache file name
        cache_suffix = f"_{f0_method}_{filter_radius}_{crepe_hop_length}_{f0_up_key}.npy"
        # get filename without extension
        input_filename = os.path.splitext(os.path.basename(input_audio_path))[0]
        cache_name = input_filename + cache_suffix
        input_file_dir = os.path.dirname(input_audio_path)
        cache_path = os.path.join(input_file_dir, cache_name)

        # Check cache, if available, load and return
        if os.path.exists(cache_path):
            try:
                return np.load(cache_path)
            except Exception as e:
                logger.error(e)
                logger.error(f"Failed to load cache {cache_path}")

        # Compute and save f0 if not cached
        f0 = self.get_f0(
            input_audio_path,
            x,
            p_len,
            f0_up_key,
            f0_method,
            filter_radius,
            crepe_hop_length,
            inp_f0,
        )
        np.save(cache_path, f0)
        return f0

    def get_f0(
        self,
        input_audio_path,
        x,
        p_len,
        f0_up_key,
        f0_method,
        filter_radius,
        crepe_hop_length,
        inp_f0=None,
    ):
        global input_audio_path2wav
        time_step = self.window / self.sr * 1000
        f0_min = 50
        f0_max = 1100
        f0_mel_min = 1127 * np.log(1 + f0_min / 700)
        f0_mel_max = 1127 * np.log(1 + f0_max / 700)
        if f0_method == "pm":
            f0 = (
                parselmouth.Sound(x, self.sr)
                .to_pitch_ac(
                    time_step=time_step / 1000,
                    voicing_threshold=0.6,
                    pitch_floor=f0_min,
                    pitch_ceiling=f0_max,
                )
                .selected_array["frequency"]
            )
            pad_size = (p_len - len(f0) + 1) // 2
            if pad_size > 0 or p_len - len(f0) - pad_size > 0:
                f0 = np.pad(f0, [[pad_size, p_len - len(f0) - pad_size]], mode="constant")
        elif f0_method == "harvest":
            input_audio_path2wav[input_audio_path] = x.astype(np.double)
            f0 = cache_harvest_f0(input_audio_path, self.sr, f0_max, f0_min, 10)
            if filter_radius > 2:
                f0 = signal.medfilt(f0, 3)
        elif f0_method == "crepe":
            f0 = self.get_f0_official_crepe_computation(x, f0_min, f0_max)
        elif f0_method == "crepe-tiny":
            f0 = self.get_f0_official_crepe_computation(x, f0_min, f0_max, "tiny")
        elif f0_method == "mangio-crepe":
            f0 = self.get_f0_crepe_computation(x, f0_min, f0_max, p_len, crepe_hop_length)
        elif f0_method == "mangio-crepe-tiny":
            f0 = self.get_f0_crepe_computation(x, f0_min, f0_max, p_len, crepe_hop_length, "tiny")
        elif f0_method == "rmvpe":
            f0 = model_rmvpe.infer_from_audio(input_audio_path, x, thred=0.03)
        else:  # fallback to using rmvpe
            f0 = model_rmvpe.infer_from_audio(input_audio_path, x, thred=0.03)
        f0 *= pow(2, f0_up_key / 12)
        tf0 = self.sr // self.window
        if inp_f0 is not None:
            delta_t = np.round((inp_f0[:, 0].max() - inp_f0[:, 0].min()) * tf0 + 1).astype("int16")
            replace_f0 = np.interp(list(range(delta_t)), inp_f0[:, 0] * 100, inp_f0[:, 1])
            shape = f0[self.x_pad * tf0 : self.x_pad * tf0 + len(replace_f0)].shape[0]
            f0[self.x_pad * tf0 : self.x_pad * tf0 + len(replace_f0)] = replace_f0[:shape]
        f0bak = f0.copy()
        # convert from hertz to mel scale
        f0_mel = 1127 * np.log(1 + f0 / 700)
        # normalize mel to 1-255
        f0_mel[f0_mel > 0] = (f0_mel[f0_mel > 0] - f0_mel_min) * 254 / (f0_mel_max - f0_mel_min) + 1
        f0_mel[f0_mel <= 1] = 1
        f0_mel[f0_mel > 255] = 255

        # round to integer
        f0_coarse = np.rint(f0_mel).astype(np.int)

        return f0_coarse, f0bak  # 1-0

    def vc(
        self,
        hubert,
        net_g,
        sid,
        audio0,
        pitch,
        pitchf,
        index,
        big_npy,
        index_rate,
        version,
        protect,
    ):
        with PIPELINE_LOCK:
            feats: Tensor = torch.from_numpy(audio0).to(self.device, dtype=torch.float32)
            if feats.dim() == 2:  # double channels
                feats = feats.mean(-1)
            assert feats.dim() == 1, feats.dim()
            feats = feats.view(1, -1)
            padding_mask = torch.BoolTensor(feats.shape).to(self.device).fill_(False)

            inputs = {
                "source": feats,
                "padding_mask": padding_mask,
                "output_layer": 9 if version == "v1" else 12,
            }
            with torch.no_grad():
                logits = hubert.extract_features(**inputs)
                feats = hubert.final_proj(logits[0]) if version == "v1" else logits[0]
            if protect < 0.5 and pitch is not None and pitchf is not None:
                feats0 = feats.clone()
            if not isinstance(index, type(None)) and not isinstance(big_npy, type(None)) and index_rate != 0:
                npy = feats[0].cpu().numpy()

                score, ix = index.search(npy, k=8)
                weight = np.square(1 / score)
                weight /= weight.sum(axis=1, keepdims=True)
                if ix != -1:
                    npy = np.sum(big_npy[ix] * np.expand_dims(weight, axis=2), axis=1)
                    feats = torch.from_numpy(npy).unsqueeze(0).to(self.device) * index_rate + (1 - index_rate) * feats

            feats = F.interpolate(feats.permute(0, 2, 1), scale_factor=2).permute(0, 2, 1)
            if protect < 0.5 and pitch is not None and pitchf is not None:
                feats0 = F.interpolate(feats0.permute(0, 2, 1), scale_factor=2).permute(0, 2, 1)
            p_len = audio0.shape[0] // self.window
            if feats.shape[1] < p_len:
                p_len = feats.shape[1]
                if pitch is not None and pitchf is not None:
                    pitch = pitch[:, :p_len]
                    pitchf = pitchf[:, :p_len]

            if protect < 0.5 and pitch is not None and pitchf is not None:
                pitchff = pitchf.clone()
                pitchff[pitchf > 0] = 1
                pitchff[pitchf < 1] = protect
                pitchff = pitchff.unsqueeze(-1)
                feats = feats * pitchff + feats0 * (1 - pitchff)
                feats = feats.to(feats0.dtype)
            p_len = torch.tensor([p_len], device=self.device).long()
            with torch.no_grad():
                if pitch is not None and pitchf is not None:
                    infer = net_g.infer(feats, p_len, pitch, pitchf, sid)
                else:
                    infer = net_g.infer(feats, p_len, sid)
                infer_data = infer[0][0, 0]
                audio1 = infer_data.data.cpu().float().numpy()
            del feats, p_len, padding_mask
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            return audio1

    def pipeline(
        self,
        hubert_model,
        net_g,
        sid,
        audio,
        input_audio_path,
        times,
        f0_up_key,
        f0_method,
        file_index,
        index_rate,
        if_f0,
        filter_radius,
        tgt_sr,
        resample_sr,
        rms_mix_rate,
        version,
        protect,
        crepe_hop_length,
        status_report,
    ):
        index = big_npy = None
        if file_index and os.path.exists(file_index) and index_rate > 0:
            try:
                status_report("Loading index...")
                index: Optional[IndexIVFFlat] = faiss.read_index(file_index)
                big_npy = index.reconstruct_n(0, index.ntotal)
                if not big_npy or big_npy.size == 0:
                    index = big_npy = None
            except Exception as e:
                logger.error(e)
                traceback.print_exc()
                index = big_npy = None

        status_report("Loading audio...")
        audio = signal.filtfilt(bh, ah, audio)
        audio_pad = np.pad(audio, (self.window // 2, self.window // 2), mode="reflect")
        opt_ts = []
        status_report("Processing audio...")
        if audio_pad.shape[0] > self.t_max:
            audio_sum = np.zeros_like(audio)
            for i in range(self.window):
                audio_sum += audio_pad[i : i - self.window]
            for t in range(self.t_center, audio.shape[0], self.t_center):
                opt_ts.append(
                    t
                    - self.t_query
                    + np.where(
                        np.abs(audio_sum[t - self.t_query : t + self.t_query])
                        == np.abs(audio_sum[t - self.t_query : t + self.t_query]).min()
                    )[0][0]
                )
        s = 0
        audio_opt = []
        audio_opt_parts = []
        t = None
        t1 = ttime()
        audio_pad = np.pad(audio, (self.t_pad, self.t_pad), mode="reflect")
        p_len = audio_pad.shape[0] // self.window

        status_report("Getting speaker id...")
        sid = torch.tensor(sid, device=self.device).unsqueeze(0).long()
        pitch, pitchf = None, None
        if if_f0 == 1:
            status_report("Getting f0...")
            pitch, pitchf = self.get_f0_cached(
                input_audio_path,
                audio_pad,
                p_len,
                f0_up_key,
                f0_method,
                filter_radius,
                crepe_hop_length,
            )
            pitch = pitch[:p_len]
            pitchf = pitchf[:p_len]
            if self.device == "mps":
                pitchf = pitchf.astype(np.float32)
                pitch = pitch.astype(np.float32)
            status_report("Setting pitch...")
            pitch = torch.tensor(pitch, device=self.device).unsqueeze(0).long()
            pitchf = torch.tensor(pitchf, device=self.device).unsqueeze(0).float()
        t2 = ttime()
        times[1] += t2 - t1
        status_report("Changing voice...")
        for t in opt_ts:
            t = t // self.window * self.window
            p = None
            pf = None
            if if_f0 == 1:
                p = pitch[:, s // self.window : (t + self.t_pad2) // self.window]
                pf = pitchf[:, s // self.window : (t + self.t_pad2) // self.window]

            audio_data = self.vc(
                hubert_model,
                net_g,
                sid,
                audio_pad[s : t + self.t_pad2 + self.window],
                p,
                pf,
                index,
                big_npy,
                index_rate,
                version,
                protect,
            )
            audio_opt.append(audio_data[self.t_pad_tgt : -self.t_pad_tgt])
            s = t
        p = None
        pf = None
        if if_f0 == 1:
            p = pitch[:, t // self.window :] if t is not None else pitch
            pf = pitchf[:, t // self.window :] if t is not None else pitchf
        audio_data = self.vc(
            hubert_model,
            net_g,
            sid,
            audio_pad[t:],
            p,
            pf,
            index,
            big_npy,
            index_rate,
            version,
            protect,
        )
        audio_opt.append(audio_data[self.t_pad_tgt : -self.t_pad_tgt])
        audio_opt = np.concatenate(audio_opt)
        if rms_mix_rate != 1:
            audio_opt = change_rms(audio, 16000, audio_opt, tgt_sr, rms_mix_rate)
        if resample_sr >= 16000 and tgt_sr != resample_sr:
            status_report("Resampling...")
            audio_opt = librosa.resample(audio_opt, orig_sr=tgt_sr, target_sr=resample_sr)
        audio_max = np.abs(audio_opt).max() / 0.99
        max_int16 = 32768
        if audio_max > 1:
            max_int16 /= audio_max
        audio_opt = (audio_opt * max_int16).astype(np.int16)
        del pitch, pitchf, sid
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        return audio_opt
