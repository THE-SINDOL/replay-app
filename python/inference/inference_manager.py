import gc
import hashlib
import logging
import os
import re
import shutil
import threading
import time
import traceback
from shutil import which
from typing import Optional

import numpy as np
import torch
import yt_dlp
from pydub import AudioSegment
from scipy.io import wavfile

from inference.api_models import CreateSongOptions, JobProgressResp, STATUS
from inference.args import parse_args
from inference.utils import find_pth_and_index_files, load_audio
import librosa

logger = logging.getLogger(__name__)


class InferenceManager:
    def set_track_values(self, track_on_disk):
        self.source_audio_path = track_on_disk
        self.track_name = os.path.splitext(os.path.basename(self.source_audio_path))[0]
        if self.sample_mode_30s:
            logger.info("Sample mode: Trimming audio to 30s")
            sample_rate = 44100
            audio_data: np.ndarray = load_audio(self.source_audio_path, sample_rate)
            start = sample_rate * (self.sample_mode_start_time or 0)
            end = start + (sample_rate * 30)
            audio_data = audio_data[start:end]
            # these md5s dont match, not a huge deal but it means we do a bit of extra work
            # might be worth looking into in the future
            self.track_md5 = hashlib.md5(audio_data.tobytes()).hexdigest()
            sample_file = os.path.join(
                self.originals_directory,
                f"sample_{self.track_md5}.wav",
            )
            wavfile.write(sample_file, sample_rate, audio_data)
            self.source_audio_path = sample_file

        self.track_md5 = hashlib.md5(open(self.source_audio_path, "rb").read()).hexdigest()
        # make a copy of the source file locally to always be able to play it
        os.makedirs(self.originals_directory, exist_ok=True)
        extension = os.path.splitext(self.source_audio_path)[1]
        self.originals_file = os.path.join(
            self.originals_directory,
            f"{self.track_md5}{extension}",
        )
        if not os.path.exists(self.originals_file):
            shutil.copyfile(self.source_audio_path, self.originals_file)
        self.source_audio_path = self.originals_file

    def __init__(
        self,
        model_name,
        models_path,
        weights_path,
        source_audio_path,
        output_directory,
        options: CreateSongOptions = None,
        job_id: str = None,
        set_status=None,
        check_stop_job=None,
    ):
        self.track_md5: Optional[str] = None
        self.track_name: Optional[str] = None
        self.source_audio_path: str = source_audio_path
        self.last_progress_resp: Optional[JobProgressResp] = None
        self.status: STATUS = "processing"
        self.set_status = set_status if set_status else lambda x: logger.info(x)
        self.check_stop_job = check_stop_job if check_stop_job else lambda: False
        self.run_thread: Optional[threading.Thread] = None
        self.instrumentals_file: Optional[str] = None
        self.vocals_file: Optional[str] = None
        self.pre_deecho_vocals_file: Optional[str] = None
        self.converted_vocals_file = None
        self.model = None
        self.job_id = job_id
        self.originals_file = None
        self.joined_track = None

        options = options or CreateSongOptions()
        pre_stemmed = options is not None and options.preStemmed
        sample_mode_30s = options is not None and options.sampleMode
        sample_mode_start_time = options is not None and options.sampleModeStartTime or 0
        pitch = options is not None and options.pitch
        instrumentals_pitch = options is not None and options.instrumentalsPitch
        vocals_only = options is not None and options.vocalsOnly
        stemming_method = options is not None and options.stemmingMethod

        self.f0_method = options is not None and options.f0Method or "rvmpe"
        self.output_format = options is not None and options.outputFormat or "mp3_320k"
        self.options = options
        self.pitch: Optional[int] = pitch
        self.vocals_only = vocals_only
        self.stemming_model = stemming_method
        self.pre_stemmed = pre_stemmed
        self.sample_mode_30s = sample_mode_30s
        self.sample_mode_start_time = sample_mode_start_time
        self.instrumentals_pitch = instrumentals_pitch
        self.model_name = model_name
        self.models_path = models_path
        self.weights_path = weights_path
        self.output_directory = os.path.join(output_directory, job_id)
        # ensure output dir exists
        os.makedirs(self.output_directory, exist_ok=True)
        self.stems_directory = os.path.join(output_directory, "stems")
        self.yt_cache = os.path.join(output_directory, "yt-cache")

        self.originals_directory = os.path.join(output_directory, "originals")
        # if it exists, set self values - if it doesn't, its either a url or a file that doesn't exist
        if os.path.exists(source_audio_path):
            self.set_track_values(source_audio_path)

        logger.info(f"Model name: {self.model_name}")
        logger.info(f"Models path: {self.models_path}")
        logger.info(f"Weights path: {self.weights_path}")
        logger.info(f"Stemming method: {self.stemming_model}")
        logger.info(f"F0 method: {self.f0_method}")
        logger.info(f"Output path: {self.output_directory}")

        self.elapsed_seconds = None
        self.error: Optional[Exception] = None
        self.remaining_seconds = None
        self.output_filepath = None

    def find_model(self, models_path: str, model_name: str):
        from inference.rvc_model import RVCModel

        model_dir = os.path.join(models_path, model_name)
        pth_files, index_files = find_pth_and_index_files(model_dir)
        model = RVCModel(model_name, pth_files, index_files)
        return model

    def load_model(self):
        self.model = self.find_model(self.models_path, self.model_name)
        if self.model is None:
            logger.info(f"Unable to load model {self.model_name}")
            runtime_error = RuntimeError(f"Unable to load model {self.model_name}")
            self.error = runtime_error
            raise runtime_error
        logger.info("---------------------------------")

    def stem_and_load_input_track(self):
        from inference.stemmer import Stemmer

        self.check_and_update_status("UVR: Starting track separation...")
        if self.pre_stemmed:
            logger.info("UVR: Pre-stemmed track detected. Skipping separation.")
            self.vocals_file = self.source_audio_path
        else:
            start_time = time.time()

            def update_status(msg):
                self.check_and_update_status(f"Separating track... {msg}")

            self.vocals_file, self.instrumentals_file = Stemmer.separate_track(
                self.source_audio_path,
                self.stems_directory,
                self.weights_path,
                self.stemming_model,
                update_status,
            )
            elapsed_time = time.time() - start_time
            logger.info(f"UVR: Separation complete. Elapsed time: {elapsed_time}")
            if self.options.deEchoDeReverb:
                self.check_and_update_status("De-Echoing input file")
                md5_vocals = hashlib.md5(open(self.vocals_file, "rb").read()).hexdigest()
                vocal_copies_dir = os.path.join(
                    self.stems_directory,
                    "vocals_copies",
                )
                # ensure dirs exist
                os.makedirs(vocal_copies_dir, exist_ok=True)
                md5_vocals_file = os.path.join(
                    vocal_copies_dir,
                    f"{md5_vocals}.wav",
                )
                if not os.path.exists(md5_vocals_file):
                    shutil.copyfile(self.vocals_file, md5_vocals_file)
                self.pre_deecho_vocals_file = self.vocals_file

                def update_status_deecho(msg):
                    self.check_and_update_status(f"De-echoing track... {msg}")

                self.check_and_update_status("De-Echoing input file")
                self.vocals_file, echo_and_reverb_file = Stemmer.separate_track(
                    md5_vocals_file,
                    self.stems_directory,
                    self.weights_path,
                    "UVR-DeEcho-DeReverb by FoxJoy",
                    update_status_deecho,
                )
                # we might want to merge the echo and reverb back into the instrumentals? or run the model on it? idk
                elapsed_time = time.time() - start_time
                logger.info(f"De-echo complete. Elapsed time: {elapsed_time}")

        logger.info("UVR: Track separation complete.")
        logger.info("---------------------------------")

    def pitch_shift(self, audio: AudioSegment, pitch: int):
        # Check if audio is stereo
        is_stereo = audio.channels == 2

        # Split stereo to mono if necessary
        if is_stereo:
            audio_channels = audio.split_to_mono()
        else:
            audio_channels = [audio]

        shifted_channels = []

        for channel in audio_channels:
            # Convert the audio samples of the channel to a NumPy array
            samples = np.array(channel.get_array_of_samples())
            samples_float = samples.astype(np.float32) / np.iinfo(samples.dtype).max

            # Use librosa to perform the pitch shift
            y_shifted = librosa.effects.pitch_shift(samples_float, sr=audio.frame_rate, n_steps=float(pitch))

            # Convert the floating-point values back to the original data type
            int_samples = np.array(y_shifted * np.iinfo(samples.dtype).max, dtype=samples.dtype)

            # Create a new AudioSegment object with the modified samples for the channel
            shifted_channel = AudioSegment(
                int_samples.tobytes(),
                frame_rate=audio.frame_rate,
                sample_width=audio.sample_width,
                channels=1,
            )

            shifted_channels.append(shifted_channel)

        # Merge channels back into stereo or just return mono, as appropriate
        if is_stereo:
            shifted_audio = AudioSegment.from_mono_audiosegments(*shifted_channels)
        else:
            shifted_audio = shifted_channels[0]

        return shifted_audio

    def perform_inference(self):
        try:
            self.check_and_update_status("Starting inference...")
            tgt_sr, audio_opt = self.model.run_inference(
                self.vocals_file,
                self.weights_path,
                self.check_and_update_status,
                self.options,
            )
            self.check_and_update_status("Creating audio files...")
            outputs = os.path.join(self.output_directory, "audio-outputs")
            converted_vocals_file = f"converted_vocals.wav"
            vocal_output = os.path.join(outputs, converted_vocals_file)
            self.converted_vocals_file = vocal_output
            os.makedirs(outputs, exist_ok=True)
            logger.info(f"RVCv2: Inference succeeded. Writing to {vocal_output}...")
            wavfile.write(vocal_output, tgt_sr, audio_opt)
            logger.info(f"RVCv2: Finished! Saved output to {vocal_output}")
            logger.info("---------------------------------")
            logger.info("Rejoining the track...")
            # Load the audio files
            vocal = AudioSegment.from_wav(vocal_output)
            if self.pre_stemmed:
                self.joined_track = vocal
            elif self.instrumentals_file is not None:
                instrumental = AudioSegment.from_wav(self.instrumentals_file)
                if self.instrumentals_pitch:
                    logger.info("RVCv2: Adjusting pitch of instrumentals...")
                    instrumental = self.pitch_shift(instrumental, self.instrumentals_pitch)
                # Combine the audio files
                self.joined_track = instrumental.overlay(vocal)
            else:
                logger.info("RVCv2: Unable to find instrumentals file. Skipping rejoin.")

            logger.info("Track rejoined.")
            logger.info("Writing completed file...")
            # Check the output format
            if self.output_format == "wav":
                output_file = "final.wav"
                parameters = {"format": "wav"}
            elif self.output_format == "mp3_192k":
                output_file = "final.mp3"
                parameters = {"format": "mp3", "bitrate": "192k"}
            elif self.output_format == "mp3_320k":
                output_file = "final.mp3"
                parameters = {"format": "mp3", "bitrate": "320k"}
            else:
                logger.info("Unsupported output format: {}. Using default (mp3_192k).".format(self.output_format))
                output_file = "final.mp3"
                parameters = {"format": "mp3", "bitrate": "192k"}
            joined_track_export = os.path.join(self.output_directory, output_file)
            self.joined_track.export(joined_track_export, **parameters)
            logger.info(f"Track successfully written to: {joined_track_export}")
            self.output_filepath = joined_track_export
            logger.info("---------------------------------")
            logger.info("Inference complete.")
            # Clear references/memory
            self.model.clearMemory()
            del self.model
            del audio_opt
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            gc.collect()
        except Exception as e:
            if self.status == "stopped":
                self.check_and_update_status(
                    "Stopped",
                )
                return
            self.error = e
            self.status = "errored"
            self.check_and_update_status(f"Error: {e}", "errored")
            logger.info("RVCv2: Inference failed. Here's the traceback: ")
            traceback.print_exc()
            logger.info(e)
            raise e

    def check_and_download_youtube_audio(self, url):
        # Check if the url is a valid YouTube video link
        youtube_regex = (
            r"(https?://)?(www\.)?"
            "(youtube|youtu|youtube-nocookie)\.(com|be)/"
            "(watch\?v=|embed/|v/|.+\?v=)?([^&=%\?]{11})"
        )

        youtube_regex_match = re.match(youtube_regex, url)
        if not youtube_regex_match:
            return False, None

        def my_hook(d):
            if d["status"] == "finished":
                self.check_and_update_status("Youtube download complete")
            if d["status"] == "downloading":
                self.check_and_update_status(f"Downloading youtube audio:{d['_percent_str']}{d['_speed_str']}")

        # Define the options for youtube_dl
        ydl_opts = {
            "format": "bestaudio/best",
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "320",
                }
            ],
            "noplaylist": True,
            "progress_hooks": [my_hook],
        }

        # Use youtube_dl to extract title info
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=False)
            video_title = info_dict.get("title", None)

        # Sanitize the title for use in a filename
        safe_title = (
            video_title.replace(" ", "_").replace("/", "_").replace("\\", "_").replace(":", "_").replace("*", "_")
        )
        # even more safe title
        safe_title = "".join(x for x in safe_title if x.isalnum())
        # windows can only support 255 characters, so trim if longer
        yt_cache_len = len(self.yt_cache)
        if len(safe_title) + yt_cache_len > 255:
            safe_title = safe_title[: 255 - yt_cache_len]
        ydl_opts["outtmpl"] = f"{self.yt_cache}/{safe_title}"

        # Check if file already exists
        output_path = f"{self.yt_cache}/{safe_title}.mp3"
        if os.path.exists(output_path):
            return True, output_path

        # Now download the video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            self.check_and_update_status("Downloading audio from YouTube...")
            ydl.download([url])
            return True, output_path

    def check_and_update_status(self, status_message, status: STATUS = None):
        # Update local status
        self.status = status if status else self.status
        # Check if we should stop
        if self.check_stop_job() and self.status != "stopped":
            self.status = "stopped"
            raise RuntimeError("Stopped")
        # Print for debugging
        logger.info(f"Status ({self.status}): {status_message}")
        # Otherwise update current status
        error_str = None
        if self.error:
            error_str = str(self.error)
        progress_resp = JobProgressResp(
            status=self.status,
            message=status_message,
            error=error_str,
            elapsedSeconds=self.elapsed_seconds,
            remainingSeconds=self.remaining_seconds,
            outputFilepath=self.output_filepath,
            inputFilepath=self.source_audio_path,
            preDeechoVocalsFile=self.pre_deecho_vocals_file,
            originalVocalsPath=self.vocals_file,
            convertedVocalsPath=self.converted_vocals_file,
            instrumentalsPath=self.instrumentals_file,
            options=self.options,
            modelId=self.model_name,
            songHash=self.track_md5,
            trackName=self.track_name,
        )
        self.set_status(progress_resp)
        self.last_progress_resp = progress_resp

    def check_deps(self):
        ffmpeg_bin = which("ffmpeg")
        if not ffmpeg_bin:
            self.status = "errored"
            runtime_error = RuntimeError("ffmpeg not found")
            self.error = runtime_error
            logger.info(f"App path: {os.environ.get('PATH')}")
            raise runtime_error

    def set_source_audio_path(self):
        is_yt_video, yt_audio_path = self.check_and_download_youtube_audio(self.source_audio_path)
        if is_yt_video:
            if not os.path.exists(yt_audio_path):
                raise RuntimeError(f"Unable to download YouTube video: {self.source_audio_path}")
            self.set_track_values(yt_audio_path)

    def create_preview_tracks(self):
        files = [
            self.vocals_file,
            self.converted_vocals_file,
            self.instrumentals_file,
            self.pre_deecho_vocals_file,
            self.output_filepath,
        ]
        for file in files:
            try:
                if not file:
                    continue
                if os.path.exists(file) and file.endswith("wav"):
                    filename, ext = os.path.splitext(file)
                    preview_file = f"{filename}_preview.mp3"
                    preview_path = os.path.join(os.path.dirname(file), preview_file)
                    if os.path.exists(preview_path):
                        continue
                    logger.info(f"Creating preview track: {preview_file}")
                    vocal = AudioSegment.from_wav(file)
                    vocal.export(preview_path, format="mp3", bitrate="192k")
            except Exception as e:
                logger.error(f"Error creating preview track: {e}")

    def infer(self):
        start_time = time.time()
        try:
            self.check_and_update_status("Starting up...", "processing")
            self.check_deps()
            self.check_and_update_status("Dependencies checked")
            self.set_source_audio_path()
            logger.info(f"Source audio path: {self.source_audio_path}")
            if self.vocals_only:
                self.check_and_update_status("Skipping inference due to vocalsOnly option")
                self.stem_and_load_input_track()
                self.output_filepath = self.vocals_file
                self.create_preview_tracks()
                return
            self.check_and_update_status("Loading model...")
            self.load_model()
            self.check_and_update_status("Separating track...")
            self.stem_and_load_input_track()

            self.check_and_update_status("Performing inference...")
            self.perform_inference()
            self.create_preview_tracks()
            if self.status != "stopped":
                self.check_and_update_status("Completed", "completed")
        except RuntimeError as e:
            logger.info(e)
            traceback.print_exc()
            self.error = e
            if self.status == "stopped":
                # Runtime Error from stopping. Do nothing.
                self.check_and_update_status("Stopped", "stopped")
                return
            self.check_and_update_status("Error", "errored")
        except Exception as e:
            if self.status == "stopped":
                return
            self.error = e
            self.check_and_update_status("Error", "errored")
            logger.error(e)
            traceback.print_exc()
        finally:
            if self.status == "processing":
                self.check_and_update_status("Completed", "completed")
            logger.info("Last progress response:")
            logger.info(self.last_progress_resp)
            elapsed_time = time.time() - start_time
            logger.info(f"Total elapsed time: {elapsed_time}")


def main():
    args = parse_args()
    inference_manager = InferenceManager(
        args.model_name,
        args.model_dir,
        args.weights_dir,
        args.source_audio_path,
        args.out_dir,
    )
    inference_manager.infer()


if __name__ == "__main__":
    main()
