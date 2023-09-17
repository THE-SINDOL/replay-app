import os
from threading import Lock

from inference.config import config

HUBERT_LOCK = Lock()


class HubertModel:
    def __init__(
        self,
    ):
        self.hubert_model = None

    def load_model(self, weights_path: str):
        from fairseq import checkpoint_utils

        with HUBERT_LOCK:
            if self.hubert_model is not None:
                return

            models, _, _ = checkpoint_utils.load_model_ensemble_and_task(
                [os.path.join(weights_path, "hubert_base.pt")],
            )
            model = models[0].to(config.device)
            self.hubert_model = model.float()
            self.hubert_model.eval()


hubert_model = HubertModel()
