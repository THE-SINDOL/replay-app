import builtins
import logging
import os
import ssl
import subprocess as sp
import sys

from server_args import get_server_arg_parser

logger = logging.getLogger()


def init_logging():
    parser = get_server_arg_parser()
    args = parser.parse_args()

    logger.setLevel(logging.INFO)
    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")

    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(logging.INFO)
    stdout_handler.setFormatter(formatter)
    log_filename = f"replay-server.log"
    log_path = os.path.join(args.log_dir, log_filename)

    file_handler = logging.FileHandler(log_path, "a")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(stdout_handler)

    logger.info(f"Logging to {log_path}")


ssl._create_default_https_context = ssl._create_unverified_context


# monkey patch sp.check_output to always set stdin to DEVNULL if its not set - fixes demucs ffprobe
original_check_output = sp.check_output


def check_output(*args, **kwargs):
    if "stdin" not in kwargs:
        kwargs["stdin"] = sp.DEVNULL
    if "stderr" not in kwargs:
        kwargs["stderr"] = sp.STDOUT
    return original_check_output(*args, **kwargs)


def timestamped_print(*args, sep=" ", end="\n", file=sys.stdout, flush=False):
    message = sep.join(str(arg) for arg in args) + end
    if file == sys.stdout or file == sys.stderr:
        logger.info(message.rstrip("\n"))  # Logging the message to the logger
    else:
        file.write(message)  # Writing the message to the specified file
    if flush and hasattr(file, "flush"):
        file.flush()


def monkey_patch_sys():
    # Save the old print function (if not done already) and override it
    if not hasattr(builtins, "old_print"):
        builtins.old_print = builtins.print
    builtins.print = timestamped_print
    sp.check_output = check_output
