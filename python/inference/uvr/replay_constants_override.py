# Change the current working directory to the directory
# this file sits in
import os
import sys

if getattr(sys, "frozen", False):
    # If the application is run as a bundle, the PyInstaller bootloader
    # extends the sys module by a flag frozen=True and sets the app
    # path into variable _MEIPASS'.
    BASE_PATH = os.path.join(sys._MEIPASS, "inference", "uvr")
else:
    BASE_PATH = os.path.dirname(os.path.abspath(__file__))

# --Constants--
MDX_MIXER_PATH = os.path.join(BASE_PATH, "lib_v5", "mixer.ckpt")
