from monkey_patch_init import completed

if not completed:
    print("Error monkey patching")

import os
import signal
import threading
import time
from multiprocessing import current_process

import uvicorn

if os.name != "nt":
    os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"
import multiprocessing
from uvicorn.config import LOGGING_CONFIG, Config
import logging

logger = logging.getLogger(__name__)


class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        message = record.getMessage()
        has_filterable_keyword = "/health" in message or "/jobs" in message
        return not has_filterable_keyword


def start_server():
    def check_parent():
        parent_id = os.getppid()
        while True:
            if os.getppid() != parent_id:
                logger.info("Parent process has died. Shutting down server...")
                server.should_exit = True
                server.shutdown()
                os.kill(current_process().pid, signal.SIGINT)
                time.sleep(5)
                if os.getpid() != 0:  # If server process is still alive
                    logger.error("Server did not shut down, force killing...")
                    os.kill(current_process().pid, signal.SIGKILL)
                    break
                break

            time.sleep(5)

    parent_checker = threading.Thread(target=check_parent)
    parent_checker.daemon = True
    parent_checker.start()

    LOGGING_CONFIG["formatters"]["default"]["fmt"] = "%(asctime)s [%(name)s] %(levelprefix)s %(message)s"
    LOGGING_CONFIG["formatters"]["access"][
        "fmt"
    ] = '%(asctime)s [%(name)s] %(levelprefix)s %(client_addr)s - "%(request_line)s" %(status_code)s'

    # Filter out /endpoint
    logging.getLogger("uvicorn.access").addFilter(EndpointFilter())
    port = int(os.environ.get("REPLAY_PORT", 62362))
    config = Config(
        "app:app",
        host="127.0.0.1",
        port=port,
        log_level="warning",
        reload=False,
        workers=0,
    )
    server = uvicorn.Server(config)
    logger.info(f"Server starting, listening on {port}")
    server.run()


if __name__ == "__main__":
    logger.info("Starting server...")
    logger.info(f"PATH: {os.environ.get('PATH')}")
    multiprocessing.freeze_support()
    start_server()
