import os

import ffmpeg
import numpy as np


def load_audio(file, sr) -> np.ndarray:
    try:
        # https://github.com/openai/whisper/blob/main/whisper/audio.py#L26
        # This launches a subprocess to decode audio while down-mixing and resampling as necessary.
        # Requires the ffmpeg CLI and `ffmpeg-python` package to be installed.
        file = file.strip(" ").strip('"').strip("\n").strip('"').strip(" ")
        job = ffmpeg.input(file, threads=0).output("-", format="f32le", acodec="pcm_f32le", ac=1, ar=sr)
        out, _ = job.run(cmd=["ffmpeg", "-nostdin"], capture_stdout=True, capture_stderr=True)

    except Exception as e:
        raise RuntimeError(f"Failed to load audio file {file}: {e}")

    return np.frombuffer(out, np.float32).flatten()


def seconds_to_time(seconds):
    # This function takes an integer number of seconds and returns a string in the format MM:SS
    minutes, seconds = divmod(seconds, 60)
    return "{:02}:{:02}".format(int(minutes), int(seconds))


def find_pth_and_index_files(directory):
    pth_files = []
    index_files = []

    for root, _, files in os.walk(directory):
        for filename in files:
            lower_filename = filename.lower()
            if lower_filename.endswith(".pth"):
                pth_files.append(os.path.join(root, filename))
            if lower_filename.endswith(".index"):
                index_files.append(os.path.join(root, filename))

    if len(pth_files) == 0:
        raise RuntimeError(f"No .pth files found in {directory}")
    return pth_files, index_files
