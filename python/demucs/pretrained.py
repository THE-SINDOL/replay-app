# Copyright (c) Meta Platforms, Inc. and affiliates.
# All rights reserved.
#
# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.
"""Loading pretrained models.
"""

import logging
import typing as tp
from pathlib import Path

from .hdemucs import HDemucs
from .repo import AnyModelRepo, BagOnlyRepo, LocalRepo, ModelLoadingError, ModelOnlyRepo, RemoteRepo  # noqa

logger = logging.getLogger(__name__)
ROOT_URL = "https://dl.fbaipublicfiles.com/demucs/"
REMOTE_ROOT = Path(__file__).parent / "remote"

SOURCES = ["drums", "bass", "other", "vocals"]
DEFAULT_MODEL = "htdemucs"


def demucs_unittest():
    model = HDemucs(channels=4, sources=SOURCES)
    return model


def add_model_flags(parser):
    group = parser.add_mutually_exclusive_group(required=False)
    group.add_argument("-s", "--sig", help="Locally trained XP signature.")
    group.add_argument("-n", "--name", default=None, help="Pretrained model name or signature. Default is htdemucs.")
    parser.add_argument("--repo", type=Path, help="Folder containing all pre-trained models for use with -n.")


def _parse_remote_files(remote_file_list) -> tp.Dict[str, str]:
    root: str = ""
    models: tp.Dict[str, str] = {}
    for line in remote_file_list.read_text().split("\n"):
        line = line.strip()
        if line.startswith("#"):
            continue
        elif line.startswith("root:"):
            root = line.split(":", 1)[1].strip()
        else:
            sig = line.split("-", 1)[0]
            assert sig not in models
            models[sig] = ROOT_URL + root + line
    return models


def get_model(name: str, repo: tp.Optional[Path] = None):
    """`name` must be a bag of models name or a pretrained signature
    from the remote AWS model repo or the specified local repo if `repo` is not None.
    """
    if name == "demucs_unittest":
        return demucs_unittest()
    model_repo: ModelOnlyRepo
    if repo is None:
        models = _parse_remote_files(REMOTE_ROOT / "files.txt")
        model_repo = RemoteRepo(models)
        bag_repo = BagOnlyRepo(REMOTE_ROOT, model_repo)
    else:
        if not repo.is_dir():
            raise RuntimeError(f"{repo} must exist and be a directory.")
        model_repo = LocalRepo(repo)
        bag_repo = BagOnlyRepo(repo, model_repo)
    any_repo = AnyModelRepo(model_repo, bag_repo)
    model = any_repo.get_model(name)
    model.eval()
    return model


def get_model_from_args(args):
    """
    Load local model package or pre-trained model.
    """
    return get_model(name=args.name, repo=args.repo)
