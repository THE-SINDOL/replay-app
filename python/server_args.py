import argparse
import os
import tempfile


def get_server_arg_parser():
    parser = argparse.ArgumentParser("server", description="Python server for replay")
    parser.add_argument("-l", "--log-dir", default=tempfile.gettempdir(), help="Directory to store logs in")
    parser.add_argument("-p", "--parent-pid", default=os.getppid(), help="Parent process id to monitor")
    return parser
