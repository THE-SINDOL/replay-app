import logging
import os
from typing import Literal

import torch

DEVICE = Literal["cpu", "cuda", "xla", "mps"]  # todo add xla
logger = logging.getLogger(__name__)


class Config:
    device: DEVICE

    def __init__(self):
        self.ort_providers = []
        if torch.cuda.is_available():
            self.device = "cuda"
            self.ort_providers.append("CUDAExecutionProvider")
        elif torch.backends.mps.is_available():
            self.device = "mps"
            self.ort_providers.append("CoreMLExecutionProvider")
        else:
            self.device = "cpu"
        self.ort_providers.append("CPUExecutionProvider")
        logger.info("Using device: %s" % self.device)
        self.n_cpu = os.cpu_count()
        self.n_gpu = torch.cuda.device_count() if torch.cuda.is_available() else 0
        self.gpu_name = None
        self.gpu_mem = None
        self.python_cmd = "python"
        self.listen_port = 7865
        self.iscolab = False
        self.noparallel = False
        self.noautoopen = True
        self.x_pad = 1
        self.x_query = 6
        self.x_center = 38
        self.x_max = 41


config = Config()
is_windows = os.name == "nt"
