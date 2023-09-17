import platform

# Platform Details
OPERATING_SYSTEM = platform.system()
SYSTEM_ARCH = platform.platform()
SYSTEM_PROC = platform.processor()
ARM: str = "arm"

# Model Types
VR_ARCH_TYPE = "VR Arc"
MDX_ARCH_TYPE = "MDX-Net"
DEMUCS_ARCH_TYPE = "Demucs"
VR_ARCH_PM = "VR Architecture"
SECONDARY_MODEL = "Secondary Model"
DEMUCS_6_STEM_MODEL = "htdemucs_6s"

DEMUCS_V3_ARCH_TYPE = "Demucs v3"
DEMUCS_V4_ARCH_TYPE = "Demucs v4"
DEMUCS_NEWER_ARCH_TYPES = [DEMUCS_V3_ARCH_TYPE, DEMUCS_V4_ARCH_TYPE]

DEMUCS_V1 = "v1"
DEMUCS_V2 = "v2"
DEMUCS_V3 = "v3"
DEMUCS_V4 = "v4"

DEMUCS_V1_TAG = "v1 | "
DEMUCS_V2_TAG = "v2 | "
DEMUCS_V3_TAG = "v3 | "
DEMUCS_V4_TAG = "v4 | "
DEMUCS_NEWER_TAGS = [DEMUCS_V3_TAG, DEMUCS_V4_TAG]

DEMUCS_VERSION_MAPPER = {
    DEMUCS_V1: DEMUCS_V1_TAG,
    DEMUCS_V2: DEMUCS_V2_TAG,
    DEMUCS_V3: DEMUCS_V3_TAG,
    DEMUCS_V4: DEMUCS_V4_TAG,
}

# Menu Options

AUTO_SELECT = "Auto"

# Extensions

ONNX = ".onnx"
CKPT = ".ckpt"
YAML = ".yaml"
PTH = ".pth"
TH_EXT = ".th"
JSON = ".json"

# GUI Buttons

START_PROCESSING = "Start Processing"
WAIT_PROCESSING = "Please wait..."
STOP_PROCESSING = "Halting process, please wait..."

# ---Messages and Logs----

MODEL_PRESENT = "present"

UNRECOGNIZED_MODEL = (
    "Unrecognized Model Detected",
    " is an unrecognized model.\n\n" + "Would you like to select the correct parameters before continuing?",
)

STOP_PROCESS_CONFIRM = (
    "Confirmation",
    "You are about to stop all active processes.\n\nAre you sure you wish to continue?",
)
PICKLE_CORRU = (
    "File Corrupted",
    "Unable to load this ensemble.\n\n" + "Would you like to remove this ensemble from your list?",
)
DELETE_ENS_ENTRY = "Confirm Removal", "Are you sure you want to remove this entry?"

ALL_STEMS = "All Stems"
VOCAL_STEM = "Vocals"
INST_STEM = "Instrumental"
OTHER_STEM = "Other"
BASS_STEM = "Bass"
DRUM_STEM = "Drums"
GUITAR_STEM = "Guitar"
PIANO_STEM = "Piano"
SYNTH_STEM = "Synthesizer"
STRINGS_STEM = "Strings"
WOODWINDS_STEM = "Woodwinds"
BRASS_STEM = "Brass"
WIND_INST_STEM = "Wind Inst"
NO_OTHER_STEM = "No Other"
NO_BASS_STEM = "No Bass"
NO_DRUM_STEM = "No Drums"
NO_GUITAR_STEM = "No Guitar"
NO_PIANO_STEM = "No Piano"
NO_SYNTH_STEM = "No Synthesizer"
NO_STRINGS_STEM = "No Strings"
NO_WOODWINDS_STEM = "No Woodwinds"
NO_WIND_INST_STEM = "No Wind Inst"
NO_BRASS_STEM = "No Brass"
PRIMARY_STEM = "Primary Stem"
SECONDARY_STEM = "Secondary Stem"

# Other Constants
DEMUCS_2_SOURCE = ["instrumental", "vocals"]
DEMUCS_4_SOURCE = ["drums", "bass", "other", "vocals"]

DEMUCS_2_SOURCE_MAPPER = {INST_STEM: 0, VOCAL_STEM: 1}

DEMUCS_4_SOURCE_MAPPER = {BASS_STEM: 0, DRUM_STEM: 1, OTHER_STEM: 2, VOCAL_STEM: 3}

DEMUCS_6_SOURCE_MAPPER = {BASS_STEM: 0, DRUM_STEM: 1, OTHER_STEM: 2, VOCAL_STEM: 3, GUITAR_STEM: 4, PIANO_STEM: 5}

DEMUCS_4_SOURCE_LIST = [BASS_STEM, DRUM_STEM, OTHER_STEM, VOCAL_STEM]
DEMUCS_6_SOURCE_LIST = [BASS_STEM, DRUM_STEM, OTHER_STEM, VOCAL_STEM, GUITAR_STEM, PIANO_STEM]

DEMUCS_UVR_MODEL = "UVR_Model"

CHOOSE_STEM_PAIR = "Choose Stem Pair"

STEM_SET_MENU = (
    VOCAL_STEM,
    INST_STEM,
    OTHER_STEM,
    BASS_STEM,
    DRUM_STEM,
    GUITAR_STEM,
    PIANO_STEM,
    SYNTH_STEM,
    STRINGS_STEM,
    WOODWINDS_STEM,
    BRASS_STEM,
    WIND_INST_STEM,
    NO_OTHER_STEM,
    NO_BASS_STEM,
    NO_DRUM_STEM,
    NO_GUITAR_STEM,
    NO_PIANO_STEM,
    NO_SYNTH_STEM,
    NO_STRINGS_STEM,
    NO_WOODWINDS_STEM,
    NO_BRASS_STEM,
    NO_WIND_INST_STEM,
)

STEM_PAIR_MAPPER = {
    VOCAL_STEM: INST_STEM,
    INST_STEM: VOCAL_STEM,
    OTHER_STEM: NO_OTHER_STEM,
    BASS_STEM: NO_BASS_STEM,
    DRUM_STEM: NO_DRUM_STEM,
    GUITAR_STEM: NO_GUITAR_STEM,
    PIANO_STEM: NO_PIANO_STEM,
    SYNTH_STEM: NO_SYNTH_STEM,
    STRINGS_STEM: NO_STRINGS_STEM,
    WOODWINDS_STEM: NO_WOODWINDS_STEM,
    BRASS_STEM: NO_BRASS_STEM,
    WIND_INST_STEM: NO_WIND_INST_STEM,
    NO_OTHER_STEM: OTHER_STEM,
    NO_BASS_STEM: BASS_STEM,
    NO_DRUM_STEM: DRUM_STEM,
    NO_GUITAR_STEM: GUITAR_STEM,
    NO_PIANO_STEM: PIANO_STEM,
    NO_SYNTH_STEM: SYNTH_STEM,
    NO_STRINGS_STEM: STRINGS_STEM,
    NO_WOODWINDS_STEM: WOODWINDS_STEM,
    NO_BRASS_STEM: BRASS_STEM,
    NO_WIND_INST_STEM: WIND_INST_STEM,
    PRIMARY_STEM: SECONDARY_STEM,
}

NON_ACCOM_STEMS = (
    VOCAL_STEM,
    OTHER_STEM,
    BASS_STEM,
    DRUM_STEM,
    GUITAR_STEM,
    PIANO_STEM,
    SYNTH_STEM,
    STRINGS_STEM,
    WOODWINDS_STEM,
    BRASS_STEM,
    WIND_INST_STEM,
)

MDX_NET_FREQ_CUT = [VOCAL_STEM, INST_STEM]

DEMUCS_4_STEM_OPTIONS = (ALL_STEMS, VOCAL_STEM, OTHER_STEM, BASS_STEM, DRUM_STEM)
DEMUCS_6_STEM_OPTIONS = (ALL_STEMS, VOCAL_STEM, OTHER_STEM, BASS_STEM, DRUM_STEM, GUITAR_STEM, PIANO_STEM)
DEMUCS_2_STEM_OPTIONS = (VOCAL_STEM, INST_STEM)
DEMUCS_4_STEM_CHECK = (OTHER_STEM, BASS_STEM, DRUM_STEM)

# Menu Dropdowns
MIN_SPEC = "Min Spec"
MAX_SPEC = "Max Spec"
AUDIO_AVERAGE = "Average"

BATCH_MODE = "Batch Mode"
DEF_OPT = "Default"

CHUNKS = (
    AUTO_SELECT,
    "1",
    "5",
    "10",
    "15",
    "20",
    "25",
    "30",
    "35",
    "40",
    "45",
    "50",
    "55",
    "60",
    "65",
    "70",
    "75",
    "80",
    "85",
    "90",
    "95",
    "Full",
)

BATCH_SIZE = (DEF_OPT, "2", "3", "4", "5", "6", "7", "8", "9", "10")

MARGIN_SIZE = ("44100", "22050", "11025")

DEMUCS_SEGMENTS = (
    "Default",
    "1",
    "5",
    "10",
    "15",
    "20",
    "25",
    "30",
    "35",
    "40",
    "45",
    "50",
    "55",
    "60",
    "65",
    "70",
    "75",
    "80",
    "85",
    "90",
    "95",
    "100",
)

DEMUCS_SHIFTS = (0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20)

DEMUCS_OVERLAP = (0.25, 0.50, 0.75, 0.99)

VR_WINDOW = ("320", "512", "1024")

WAV = "WAV"
FLAC = "FLAC"
MP3 = "MP3"

MP3_BIT_RATES = ("96k", "128k", "160k", "224k", "256k", "320k")
WAV_TYPE = ("PCM_U8", "PCM_16", "PCM_24", "PCM_32", "32-bit Float", "64-bit Float")

# Separation Text

SAVING_STEM = "Saving ", " stem..."
DONE = " Done!\n"

WOOD_INST_MODEL_HASH = "0ec76fd9e65f81d8b4fbd13af4826ed8"
WOOD_INST_PARAMS = {"vr_model_param": "4band_v3", "primary_stem": NO_WIND_INST_STEM}
