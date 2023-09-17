# import monkey patch above all else
import argparse
import os

is_windows = os.name == "nt"


def parse_args():
    parser = argparse.ArgumentParser()

    parser.add_argument("--model_dir", type=str, help="Model dir", default="models")
    parser.add_argument(
        "--weights_dir",
        type=str,
        help="Model dir",
        default="/Users/jonlucadecaro/Library/Application Support/com.replay.Replay/weights",
    )
    parser.add_argument(
        "--model_name",
        type=str,
        help="Model name. Will recursively search models/<name>/ for .pth and .index files",
    )
    parser.add_argument(
        "--source_audio_path",
        type=str,
        help="Source audio path, e.g., myFolder/MySource.wav.",
    )
    parser.add_argument(
        "--out_dir",
        type=str,
        default="/Users/jonlucadecaro/Library/Application Support/com.replay.Replay/outputs",
    )

    parser.add_argument(
        "--output_filename",
        type=str,
        default="MyTest.wav",
        help="Output file name to be placed in './audio-outputs', e.g., MyTest.wav.",
    )
    parser.add_argument(
        "--feature_index_filepath",
        type=str,
        default="logs/mi-test/added_IVF3042_Flat_nprobe_1.index",
        help="Feature index file path, e.g., logs/mi-test/added_IVF3042_Flat_nprobe_1.index.",
    )
    parser.add_argument("--speaker_id", type=int, default=0, help="Speaker ID, e.g., 0.")
    parser.add_argument("--transposition", type=int, default=0, help="Transposition, e.g., 0.")
    parser.add_argument(
        "--f0_method",
        type=str,
        default="harvest",
        help="F0 method, e.g., 'harvest' (pm, harvest, crepe, crepe-tiny, hybrid[x,x,x,x], mangio-crepe, mangio-crepe-tiny).",
    )
    parser.add_argument("--crepe_hop_length", type=int, default=160, help="Crepe hop length, e.g., 160.")
    parser.add_argument(
        "--harvest_median_filter_radius",
        type=int,
        default=3,
        help="Harvest median filter radius (0-7), e.g., 3.",
    )
    parser.add_argument("--post_resample_rate", type=int, default=0, help="Post resample rate, e.g., 0.")
    parser.add_argument(
        "--mix_volume_envelope",
        type=int,
        default=1,
        help="Mix volume envelope, e.g., 1.",
    )
    parser.add_argument(
        "--feature_index_ratio",
        type=float,
        default=0.78,
        help="Feature index ratio (0-1), e.g., 0.78.",
    )
    parser.add_argument(
        "--voiceless_consonant_protection",
        type=float,
        default=0.33,
        help="Voiceless Consonant Protection (Less Artifact). Smaller number = more protection. 0.50 means Do not Use. E.g., 0.33.",
    )

    args = parser.parse_args()
    return args
