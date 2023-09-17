import os

from inference.monkey_patches import init_logging, monkey_patch_sys

init_logging()
monkey_patch_sys()
completed = True
if os.name != "nt":
    os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
