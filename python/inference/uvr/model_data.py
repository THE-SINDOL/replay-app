import hashlib
import os

import psutil
import torch

from inference.uvr.constants import (
    ALL_STEMS,
    BATCH_MODE,
    DEMUCS_2_SOURCE,
    DEMUCS_2_SOURCE_MAPPER,
    DEMUCS_4_SOURCE,
    DEMUCS_4_SOURCE_MAPPER,
    DEMUCS_ARCH_TYPE,
    DEMUCS_OVERLAP,
    DEMUCS_SEGMENTS,
    DEMUCS_SHIFTS,
    DEMUCS_UVR_MODEL,
    DEMUCS_V4,
    DEMUCS_VERSION_MAPPER,
    MARGIN_SIZE,
    MDX_ARCH_TYPE,
    MP3_BIT_RATES,
    OPERATING_SYSTEM,
    PRIMARY_STEM,
    STEM_PAIR_MAPPER,
    VOCAL_STEM,
    VR_ARCH_TYPE,
    VR_WINDOW,
    WAV,
)
from inference.uvr.lib_v5.vr_network.model_param_init import ModelParameters
from inference.uvr.replay_constants_override import (
    MDX_MIXER_PATH,
)

model_hash_table = {}


def vr_model_hash_dict():
    return {
        "0d0e6d143046b0eecc41a22e60224582": {"vr_model_param": "3band_44100_mid", "primary_stem": "Instrumental"},
        "18b52f873021a0af556fb4ecd552bb8e": {"vr_model_param": "2band_32000", "primary_stem": "Instrumental"},
        "1fc66027c82b499c7d8f55f79e64cadc": {"vr_model_param": "2band_32000", "primary_stem": "Instrumental"},
        "2aa34fbc01f8e6d2bf509726481e7142": {"vr_model_param": "4band_44100", "primary_stem": "No Piano"},
        "3e18f639b11abea7361db1a4a91c2559": {"vr_model_param": "4band_44100", "primary_stem": "Instrumental"},
        "570b5f50054609a17741369a35007ddd": {"vr_model_param": "4band_v3", "primary_stem": "Instrumental"},
        "5a6e24c1b530f2dab045a522ef89b751": {"vr_model_param": "1band_sr44100_hl512", "primary_stem": "Instrumental"},
        "6b5916069a49be3fe29d4397ecfd73fa": {"vr_model_param": "3band_44100_msb2", "primary_stem": "Instrumental"},
        "74b3bc5fa2b69f29baf7839b858bc679": {"vr_model_param": "4band_44100", "primary_stem": "Instrumental"},
        "827213b316df36b52a1f3d04fec89369": {"vr_model_param": "4band_44100", "primary_stem": "Instrumental"},
        "911d4048eee7223eca4ee0efb7d29256": {"vr_model_param": "4band_44100", "primary_stem": "Vocals"},
        "941f3f7f0b0341f12087aacdfef644b1": {"vr_model_param": "4band_v2", "primary_stem": "Instrumental"},
        "a02827cf69d75781a35c0e8a327f3195": {"vr_model_param": "1band_sr33075_hl384", "primary_stem": "Instrumental"},
        "b165fbff113c959dba5303b74c6484bc": {"vr_model_param": "3band_44100", "primary_stem": "Instrumental"},
        "b5f988cd3e891dca7253bf5f0f3427c7": {"vr_model_param": "4band_44100", "primary_stem": "Instrumental"},
        "b99c35723bc35cb11ed14a4780006a80": {"vr_model_param": "1band_sr44100_hl1024", "primary_stem": "Instrumental"},
        "ba02fd25b71d620eebbdb49e18e4c336": {"vr_model_param": "3band_44100_mid", "primary_stem": "Instrumental"},
        "c4476ef424d8cba65f38d8d04e8514e2": {"vr_model_param": "3band_44100_msb2", "primary_stem": "Instrumental"},
        "da2d37b8be2972e550a409bae08335aa": {"vr_model_param": "4band_44100", "primary_stem": "Vocals"},
        "db57205d3133e39df8e050b435a78c80": {"vr_model_param": "4band_44100", "primary_stem": "Instrumental"},
        "ea83b08e32ec2303456fe50659035f69": {"vr_model_param": "4band_v3", "primary_stem": "Instrumental"},
        "f6ea8473ff86017b5ebd586ccacf156b": {"vr_model_param": "4band_v2_sn", "primary_stem": "Instrumental"},
        "fd297a61eafc9d829033f8b987c39a3d": {"vr_model_param": "1band_sr32000_hl512", "primary_stem": "Instrumental"},
        "0ec76fd9e65f81d8b4fbd13af4826ed8": {"vr_model_param": "4band_v3", "primary_stem": "No Woodwinds"},
        "0fb9249ffe4ffc38d7b16243f394c0ff": {"vr_model_param": "4band_v3", "primary_stem": "No Other"},
        "6857b2972e1754913aad0c9a1678c753": {
            "vr_model_param": "4band_v3",
            "primary_stem": "No Other",
            "nout": 48,
            "nout_lstm": 128,
        },
        "f200a145434efc7dcf0cd093f517ed52": {
            "vr_model_param": "4band_v3",
            "primary_stem": "No Other",
            "nout": 48,
            "nout_lstm": 128,
        },
        "44c55d8b5d2e3edea98c2b2bf93071c7": {
            "vr_model_param": "4band_v3",
            "primary_stem": "Other",
            "nout": 48,
            "nout_lstm": 128,
        },
        "51ea8c43a6928ed3c10ef5cb2707d57b": {
            "vr_model_param": "1band_sr44100_hl1024",
            "primary_stem": "Other",
            "nout": 16,
            "nout_lstm": 128,
        },
    }


def mdx_model_hash_dict():
    return {
        "0ddfc0eb5792638ad5dc27850236c246": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Vocals",
        },
        "26d308f91f3423a67dc69a6d12a8793d": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 9,
            "mdx_n_fft_scale_set": 8192,
            "primary_stem": "Other",
        },
        "2cdd429caac38f0194b133884160f2c6": {
            "compensate": 1.045,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Instrumental",
        },
        "2f5501189a2f6db6349916fabe8c90de": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Vocals",
        },
        "398580b6d5d973af3120df54cee6759d": {
            "compensate": 1.75,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Vocals",
        },
        "488b3e6f8bd3717d9d7c428476be2d75": {
            "compensate": 1.035,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Instrumental",
        },
        "4910e7827f335048bdac11fa967772f9": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 7,
            "mdx_n_fft_scale_set": 4096,
            "primary_stem": "Drums",
        },
        "53c4baf4d12c3e6c3831bb8f5b532b93": {
            "compensate": 1.043,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Vocals",
        },
        "5d343409ef0df48c7d78cce9f0106781": {
            "compensate": 1.075,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Vocals",
        },
        "5f6483271e1efb9bfb59e4a3e6d4d098": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 9,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Vocals",
        },
        "65ab5919372a128e4167f5e01a8fda85": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 8192,
            "primary_stem": "Other",
        },
        "6703e39f36f18aa7855ee1047765621d": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 9,
            "mdx_n_fft_scale_set": 16384,
            "primary_stem": "Bass",
        },
        "6b31de20e84392859a3d09d43f089515": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Vocals",
        },
        "867595e9de46f6ab699008295df62798": {
            "compensate": 1.03,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Vocals",
        },
        "a3cd63058945e777505c01d2507daf37": {
            "compensate": 1.03,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Vocals",
        },
        "b33d9b3950b6cbf5fe90a32608924700": {
            "compensate": 1.03,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Vocals",
        },
        "c3b29bdce8c4fa17ec609e16220330ab": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 16384,
            "primary_stem": "Bass",
        },
        "ceed671467c1f64ebdfac8a2490d0d52": {
            "compensate": 1.035,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Instrumental",
        },
        "d2a1376f310e4f7fa37fb9b5774eb701": {
            "compensate": 1.035,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Instrumental",
        },
        "d7bff498db9324db933d913388cba6be": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Vocals",
        },
        "d94058f8c7f1fae4164868ae8ae66b20": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Vocals",
        },
        "dc41ede5961d50f277eb846db17f5319": {
            "compensate": 1.035,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 9,
            "mdx_n_fft_scale_set": 4096,
            "primary_stem": "Drums",
        },
        "e5572e58abf111f80d8241d2e44e7fa4": {
            "compensate": 1.028,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Instrumental",
        },
        "e7324c873b1f615c35c1967f912db92a": {
            "compensate": 1.03,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Vocals",
        },
        "1c56ec0224f1d559c42fd6fd2a67b154": {
            "compensate": 1.025,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 5120,
            "primary_stem": "Instrumental",
        },
        "f2df6d6863d8f435436d8b561594ff49": {
            "compensate": 1.035,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Instrumental",
        },
        "b06327a00d5e5fbc7d96e1781bbdb596": {
            "compensate": 1.035,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Instrumental",
        },
        "94ff780b977d3ca07c7a343dab2e25dd": {
            "compensate": 1.039,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Instrumental",
        },
        "73492b58195c3b52d34590d5474452f6": {
            "compensate": 1.043,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Vocals",
        },
        "970b3f9492014d18fefeedfe4773cb42": {
            "compensate": 1.009,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Vocals",
        },
        "1d64a6d2c30f709b8c9b4ce1366d96ee": {
            "compensate": 1.065,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 5120,
            "primary_stem": "Instrumental",
        },
        "203f2a3955221b64df85a41af87cf8f0": {
            "compensate": 1.035,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Instrumental",
        },
        "291c2049608edb52648b96e27eb80e95": {
            "compensate": 1.035,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Instrumental",
        },
        "ead8d05dab12ec571d67549b3aab03fc": {
            "compensate": 1.035,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Instrumental",
        },
        "cc63408db3d80b4d85b0287d1d7c9632": {
            "compensate": 1.033,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Instrumental",
        },
        "cd5b2989ad863f116c855db1dfe24e39": {
            "compensate": 1.035,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 9,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Reverb",
        },
        "55657dd70583b0fedfba5f67df11d711": {
            "compensate": 1.022,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 6144,
            "primary_stem": "Instrumental",
        },
        "b6bccda408a436db8500083ef3491e8b": {
            "compensate": 1.02,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Instrumental",
        },
        "8a88db95c7fb5dbe6a095ff2ffb428b1": {
            "compensate": 1.026,
            "mdx_dim_f_set": 2048,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 5120,
            "primary_stem": "Instrumental",
        },
        "b78da4afc6512f98e4756f5977f5c6b9": {
            "compensate": 1.021,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Instrumental",
        },
        "77d07b2667ddf05b9e3175941b4454a0": {
            "compensate": 1.021,
            "mdx_dim_f_set": 3072,
            "mdx_dim_t_set": 8,
            "mdx_n_fft_scale_set": 7680,
            "primary_stem": "Vocals",
        },
        "2154254ee89b2945b97a7efed6e88820": {"config_yaml": "model_2_stem_061321.yaml"},
        "063aadd735d58150722926dcbf5852a9": {"config_yaml": "model_2_stem_061321.yaml"},
        "c09f714d978b41d718facfe3427e6001": {"config_yaml": "model_2_stem_061321.yaml"},
        "fe96801369f6a148df2720f5ced88c19": {"config_yaml": "model3.yaml"},
        "02e8b226f85fb566e5db894b9931c640": {"config_yaml": "model2.yaml"},
        "e3de6d861635ab9c1d766149edd680d6": {"config_yaml": "model1.yaml"},
        "3f2936c554ab73ce2e396d54636bd373": {"config_yaml": "modelB.yaml"},
        "890d0f6f82d7574bca741a9e8bcb8168": {"config_yaml": "modelB.yaml"},
        "63a3cb8c37c474681049be4ad1ba8815": {"config_yaml": "modelB.yaml"},
        "a7fc5d719743c7fd6b61bd2b4d48b9f0": {"config_yaml": "modelA.yaml"},
        "3567f3dee6e77bf366fcb1c7b8bc3745": {"config_yaml": "modelA.yaml"},
        "a28f4d717bd0d34cd2ff7a3b0a3d065e": {"config_yaml": "modelA.yaml"},
        "c9971a18da20911822593dc81caa8be9": {"config_yaml": "sndfx.yaml"},
        "57d94d5ed705460d21c75a5ac829a605": {"config_yaml": "sndfx.yaml"},
        "e7a25f8764f25a52c1b96c4946e66ba2": {"config_yaml": "sndfx.yaml"},
        "104081d24e37217086ce5fde09147ee1": {"config_yaml": "model_2_stem_061321.yaml"},
        "1e6165b601539f38d0a9330f3facffeb": {"config_yaml": "model_2_stem_061321.yaml"},
        "fe0108464ce0d8271be5ab810891bd7c": {"config_yaml": "model_2_stem_full_band.yaml"},
        "e9b82ec90ee56c507a3a982f1555714c": {"config_yaml": "model_2_stem_full_band_2.yaml"},
    }


def determine_auto_chunks(chunks, gpu):
    """Determines appropriate chunk size based on user computer specs"""

    if OPERATING_SYSTEM == "Darwin":
        gpu = -1
    chunk_set = 0
    if chunks == BATCH_MODE:
        chunks = 0
    if chunks == "Full":
        chunk_set = 0
    elif chunks == "Auto":
        if gpu == 0:
            gpu_mem = round(torch.cuda.get_device_properties(0).total_memory / 1.074e9)
            if gpu_mem <= 6:
                chunk_set = 5
            elif 6 < gpu_mem < 16:
                chunk_set = 10
            elif gpu_mem >= 16:
                chunk_set = 40
        if gpu == -1:
            sys_mem = psutil.virtual_memory().total >> 30
            if sys_mem <= 4:
                chunk_set = 1
            elif 4 < sys_mem <= 9:
                chunk_set = 10
            elif 9 < sys_mem <= 17:
                chunk_set = 25
            elif sys_mem > 17:
                chunk_set = 60
    elif chunks == "0":
        chunk_set = 0
    else:
        chunk_set = int(chunks) or 0

    return chunk_set


class ModelData:
    def __init__(
        self,
        model_name: str,
        model_path: str,
        selected_process_method=MDX_ARCH_TYPE,
        is_secondary_model=False,
        primary_model_primary_stem=None,
        is_primary_model_primary_stem_only=False,
        is_primary_model_secondary_stem_only=False,
        is_pre_proc_model=False,
        is_dry_check=False,
    ):
        self.model_hash = None
        self.demucs_source_map = None
        self.demucs_version = None
        self.is_gpu_conversion = True
        self.is_normalization = False
        self.is_primary_stem_only = False
        self.is_secondary_stem_only = False
        self.model_path = model_path
        self.is_denoise = False
        self.mdx_batch_size = 1  # can change this
        self.is_mdx_ckpt = False
        self.wav_type_set = "FLOAT"
        self.mp3_bit_set = MP3_BIT_RATES[5]
        self.save_format = WAV
        self.is_invert_spec = False  # spectral inversion?
        self.is_mixer_mode = False  # idk
        self.demucs_stems = VOCAL_STEM
        self.demucs_source_list = []
        self.demucs_stem_count = 0
        self.mixer_path = MDX_MIXER_PATH
        self.model_name = model_name
        self.process_method = selected_process_method
        self.model_status = True
        self.primary_stem = None
        self.compensate = 0
        self.secondary_stem = None
        self.is_ensemble_mode = False
        self.ensemble_primary_stem = None
        self.ensemble_secondary_stem = None
        self.primary_model_primary_stem = primary_model_primary_stem
        self.is_secondary_model = is_secondary_model
        self.secondary_model = None
        self.secondary_model_scale = None
        self.demucs_4_stem_added_count = 0
        self.is_demucs_4_stem_secondaries = False
        self.is_4_stem_ensemble = False
        self.pre_proc_model = None
        self.pre_proc_model_activated = False
        self.is_pre_proc_model = is_pre_proc_model
        self.is_dry_check = is_dry_check
        self.model_samplerate = 44100
        self.model_capacity = 32, 128
        self.is_vr_51_model = False
        self.is_demucs_pre_proc_model_inst_mix = False
        self.manual_download_Button = None
        self.secondary_model_4_stem = []
        self.secondary_model_4_stem_scale = []
        self.secondary_model_4_stem_names = []
        self.secondary_model_4_stem_model_names_list = []
        self.all_models = []
        self.secondary_model_other = None
        self.secondary_model_scale_other = None
        self.secondary_model_bass = None
        self.secondary_model_scale_bass = None
        self.secondary_model_drums = None
        self.secondary_model_scale_drums = None

        if self.process_method == VR_ARCH_TYPE:
            self.is_secondary_model_activated = False
            self.aggression_setting = float(10)
            self.is_tta = False
            self.is_post_process = False
            self.window_size = int(VR_WINDOW[1])
            self.batch_size = 1
            self.is_high_end_process = "None"  # "mirroring" if root.is_high_end_process_var.get() else "None"
            self.post_process_threshold = float(0.1)
            self.model_capacity = 32, 128
            self.get_model_hash()
            if self.model_hash:
                vr_hashes_data = vr_model_hash_dict()
                self.model_data = self.get_model_data(vr_hashes_data)
                if self.model_data:
                    vr_model_param = self.model_data["vr_model_param"]
                    self.primary_stem = self.model_data["primary_stem"]
                    self.secondary_stem = STEM_PAIR_MAPPER[self.primary_stem]
                    self.vr_model_param = ModelParameters(vr_model_param)
                    self.model_samplerate = self.vr_model_param.param["sr"]
                    if "nout" in self.model_data.keys() and "nout_lstm" in self.model_data.keys():
                        self.model_capacity = self.model_data["nout"], self.model_data["nout_lstm"]
                        self.is_vr_51_model = True
                else:
                    self.model_status = False

        if self.process_method == MDX_ARCH_TYPE:
            self.is_secondary_model_activated = False
            self.margin = int(MARGIN_SIZE[0])
            self.chunks = 0
            self.get_model_hash()
            if self.model_hash:
                mdx_hashes = mdx_model_hash_dict()
                self.model_data = self.get_model_data(mdx_hashes)
                if self.model_data:
                    self.compensate = self.model_data["compensate"]
                    self.mdx_dim_f_set = self.model_data["mdx_dim_f_set"]
                    self.mdx_dim_t_set = self.model_data["mdx_dim_t_set"]
                    self.mdx_n_fft_scale_set = self.model_data["mdx_n_fft_scale_set"]
                    self.primary_stem = self.model_data["primary_stem"]
                    self.secondary_stem = STEM_PAIR_MAPPER[self.primary_stem]
                else:
                    self.model_status = False

        if self.process_method == DEMUCS_ARCH_TYPE:
            self.is_secondary_model_activated = False
            if not self.is_ensemble_mode:
                self.pre_proc_model_activated = False
            self.overlap = float(DEMUCS_OVERLAP[0])
            self.margin_demucs = int(MARGIN_SIZE[0])
            self.chunks_demucs = determine_auto_chunks("Auto", self.is_gpu_conversion)
            self.shifts = int(DEMUCS_SHIFTS[2])
            self.is_split_mode = True
            self.segment = DEMUCS_SEGMENTS[0]
            self.is_chunk_demucs = False
            self.is_demucs_combine_stems = True
            self.is_primary_stem_only = False
            self.is_secondary_stem_only = False
            self.get_demucs_model_data()

        self.model_basename = os.path.splitext(os.path.basename(self.model_path))[0] if self.model_status else None
        self.pre_proc_model_activated = self.pre_proc_model_activated if not self.is_secondary_model else False

        self.is_primary_model_primary_stem_only = is_primary_model_primary_stem_only
        self.is_primary_model_secondary_stem_only = is_primary_model_secondary_stem_only

        # if self.process_method == DEMUCS_ARCH_TYPE and not is_secondary_model:
        #     if self.demucs_stem_count >= 3 and self.pre_proc_model_activated:
        #         self.pre_proc_model_activated = True
        #         self.pre_proc_model = root.process_determine_demucs_pre_proc_model(self.primary_stem)
        #         self.is_demucs_pre_proc_model_inst_mix = (
        #             root.is_demucs_pre_proc_model_inst_mix_var.get() if self.pre_proc_model else False
        #         )

    # def secondary_model_data(self, primary_stem):
    #     secondary_model_data = root.process_determine_secondary_model(
    #         self.process_method, primary_stem, self.is_primary_stem_only, self.is_secondary_stem_only
    #     )
    #     self.secondary_model = secondary_model_data[0]
    #     self.secondary_model_scale = secondary_model_data[1]
    #     self.is_secondary_model_activated = False if not self.secondary_model else True
    #     if self.secondary_model:
    #         self.is_secondary_model_activated = (
    #             False if self.secondary_model.model_basename == self.model_basename else True
    #         )

    def get_demucs_model_data(self):
        self.demucs_version = DEMUCS_V4

        for key, value in DEMUCS_VERSION_MAPPER.items():
            if value in self.model_name:
                self.demucs_version = key

        self.demucs_source_list = DEMUCS_2_SOURCE if DEMUCS_UVR_MODEL in self.model_name else DEMUCS_4_SOURCE
        self.demucs_source_map = (
            DEMUCS_2_SOURCE_MAPPER if DEMUCS_UVR_MODEL in self.model_name else DEMUCS_4_SOURCE_MAPPER
        )
        self.demucs_stem_count = 2 if DEMUCS_UVR_MODEL in self.model_name else 4

        if not self.is_ensemble_mode:
            self.primary_stem = PRIMARY_STEM if self.demucs_stems == ALL_STEMS else self.demucs_stems
            self.secondary_stem = STEM_PAIR_MAPPER[self.primary_stem]

    def get_model_data(self, hash_mapper):
        for hash, settings in hash_mapper.items():
            if self.model_hash in hash:
                return settings

    def get_model_hash(self):
        self.model_hash = None

        if not os.path.isfile(self.model_path):
            self.model_status = False
        else:
            if model_hash_table:
                for key, value in model_hash_table.items():
                    if self.model_path == key:
                        self.model_hash = value
                        break

            if not self.model_hash:
                try:
                    with open(self.model_path, "rb") as f:
                        f.seek(-10000 * 1024, 2)
                        self.model_hash = hashlib.md5(f.read()).hexdigest()
                except:
                    self.model_hash = hashlib.md5(open(self.model_path, "rb").read()).hexdigest()

                table_entry = {self.model_path: self.model_hash}
                model_hash_table.update(table_entry)
