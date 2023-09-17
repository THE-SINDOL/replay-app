import asyncio
import logging
import os
import signal
import sys
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import List

import psutil
from fastapi import Body, FastAPI
from fastapi.routing import APIRoute

import monkey_patch_init
from inference.api_models import (
    ClearJobReq,
    CreateSongReq,
    CreateSongResp,
    DeviceOptionsResp,
    HealthResp,
    JobProgressReq,
    JobProgressResp,
    JobsResp,
    SetDeviceReq,
    ShutdownResp,
    StemmingModelsResp,
    StopJobReq,
    TorchDevice,
)
from inference.config import config
from inference.inference_conf import stemming_models_list


app = FastAPI(
    title="Replay",
    version="1.0",
    description="Api for replay",
)
RUNNING_JOBS: dict[str, JobProgressResp] = {}
STOP_JOBS: List[str] = []
queue = asyncio.Queue()
logger = logging.getLogger(__name__)


executor = ThreadPoolExecutor(max_workers=1)


async def process_queue():
    while True:
        body, job_id = await queue.get()
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, run_inference, body, job_id)
        queue.task_done()


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_queue())


@app.get("/", response_model=HealthResp)
async def index():
    return {"ok": True}


@app.get("/device_options", response_model=DeviceOptionsResp)
async def device_options():
    import torch

    devices = ["cpu"]
    if torch.backends.mps.is_available():
        devices.append("mps")
    if torch.cuda.is_available():
        devices.append("cuda")
    return DeviceOptionsResp(devices=devices)


@app.post("/set_device")
async def set_device(body: SetDeviceReq = Body(...)):
    config.device = body.device
    return {"ok": True}


@app.get("/health", response_model=HealthResp)
async def health():
    return {"ok": True}


@app.post("/song_progress", response_model=JobProgressResp)
async def song_progress(body: JobProgressReq = Body(...)):
    """Create the song."""
    jobId = body.jobId
    if jobId not in RUNNING_JOBS:
        return JobProgressResp(status="unknown_job", message="Error: Job not found")
    print("Health: ", RUNNING_JOBS[jobId])
    return RUNNING_JOBS[jobId]


def run_inference(body: CreateSongReq, job_id: str):
    from inference.inference_manager import InferenceManager

    """Run the inference."""
    # If we're no longer in the queue, exit
    if job_id not in RUNNING_JOBS:
        return
    try:
        # Callbacks for setting status/checking shutdown
        def set_status(status: JobProgressResp):
            status.jobId = job_id
            RUNNING_JOBS[job_id] = status

        def check_stop_job():
            return job_id in STOP_JOBS

        # Create the InferenceManager to handle this job
        inference_manager = InferenceManager(
            body.modelId,
            body.modelPath,
            body.weightsPath,
            body.songUrlOrFilePath,
            body.outputDirectory,
            options=body.options,
            job_id=job_id,
            set_status=set_status,
            check_stop_job=check_stop_job,
        )
        inference_manager.infer()
    except Exception as e:
        logger.info(f"Exception in run_inference {e}")


@app.post("/create_song", response_model=CreateSongResp)
async def create_song(body: CreateSongReq = Body(...)):
    """Create the song."""
    job_id = uuid.uuid4().hex
    resp = CreateSongResp(jobId=job_id)

    track_name = ""
    if body.songUrlOrFilePath:
        basename = os.path.basename(body.songUrlOrFilePath)
        track_name = os.path.splitext(basename or "")[0]

    RUNNING_JOBS[job_id] = JobProgressResp(
        status="queued",
        message="Waiting to start...",
        options=body.options,
        jobId=job_id,
        modelId=body.modelId or body.options.stemmingMethod or "",
        inputFilepath=body.songUrlOrFilePath or "",
        trackName=track_name or "",
    )

    await queue.put((body, job_id))
    return resp


@app.post("/clear_job")
async def clear_job(body: ClearJobReq = Body(...)):
    if body.jobId in RUNNING_JOBS:
        del RUNNING_JOBS[body.jobId]
    # remove from STOP_JOBS list
    if body.jobId in STOP_JOBS:
        STOP_JOBS.remove(body.jobId)
    return {}


@app.post("/stop_job")
async def stop_job(body: StopJobReq = Body(...)):
    if body.jobId in RUNNING_JOBS:
        STOP_JOBS.append(body.jobId)
    return {}


@app.get("/jobs", response_model=JobsResp)
async def jobs():
    jobs_in_progress = []
    for job_id, job in RUNNING_JOBS.items():
        job.jobId = job_id
        jobs_in_progress.append(job)
    return JobsResp(jobs=jobs_in_progress)


@app.get("/torch_device", response_model=TorchDevice)
async def torch_device():
    return TorchDevice(device=config.device)


@app.get("/stemming_models", response_model=StemmingModelsResp)
async def stemming_models():
    return StemmingModelsResp(models=stemming_models_list)


@app.post("/shutdown", response_model=ShutdownResp)
async def shutdown():
    threading.Thread(target=self_terminate, daemon=True).start()

    # in 5 seconds if we're still alive, just exit
    t = threading.Timer(5, super_self_terminate)
    t.daemon = True
    t.start()

    return ShutdownResp(success=True)


def super_self_terminate():
    logger.info("Super self terminate")
    os._exit(0)


def self_terminate():
    time.sleep(1)
    parent = psutil.Process(os.getppid())
    if parent is not None:
        logger.info("Killing parent process")
        parent.kill()
    logger.info("Killing self")
    os.kill(os.getpid(), signal.SIGINT)
    logger.info("Weird that we got here, but exiting")
    sys.exit(0)


def snake_to_camel_case(string: str) -> str:
    """
    Convert snake_case to camelCase
    """
    components = string.split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def use_route_names_as_operation_ids(app: FastAPI) -> None:
    """
    Simplify operation IDs so that generated API clients have simpler function
    names.

    Should be called only after all routes have been added.
    """
    for route in app.routes:
        if isinstance(route, APIRoute):
            route.operation_id = snake_to_camel_case(route.name)  # in this case, 'read_items'


use_route_names_as_operation_ids(app)
if not monkey_patch_init.completed:
    print("Error with monkey patching")
