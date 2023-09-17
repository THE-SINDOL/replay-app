# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from inference.config import DEVICE
from inference.uvr.constants import DEMUCS_ARCH_TYPE, MDX_ARCH_TYPE, VR_ARCH_TYPE

F0_METHODS = Literal["pm", "harvest", "crepe", "crepe-tiny", "mangio-crepe", "mangio-crepe-tiny", "rmvpe"]
OUTPUT_FORMATS = Literal["wav", "mp3_192k", "mp3_320k"]


class CreateSongOptions(BaseModel):
    pitch: Optional[int] = Field(default=None)
    instrumentalsPitch: Optional[int] = Field(default=None)
    preStemmed: Optional[bool] = Field(default=False)
    vocalsOnly: Optional[bool] = Field(default=False)
    sampleMode: Optional[bool] = Field(default=False)
    deEchoDeReverb: Optional[bool] = Field(default=False)
    sampleModeStartTime: Optional[int] = Field(default=0)
    f0Method: Optional[F0_METHODS] = Field(default="rmvpe")
    stemmingMethod: Optional[str] = Field(default="UVR-MDX-NET Voc FT")
    indexRatio: Optional[float] = Field(default=0.75)
    consonantProtection: Optional[float] = Field(default=0.35)
    outputFormat: Optional[OUTPUT_FORMATS] = Field(default="mp3_192k")
    volumeEnvelope: Optional[float] = Field(default=1.0)


class CreateSongReq(BaseModel):
    outputDirectory: str
    modelPath: str
    weightsPath: str
    modelId: Optional[str] = Field(default=None)
    songUrlOrFilePath: str
    options: Optional[CreateSongOptions] = Field(default=None)


class ClearJobReq(BaseModel):
    jobId: str


class StopJobReq(BaseModel):
    jobId: str


class CreateSongResp(BaseModel):
    jobId: str


class JobProgressReq(BaseModel):
    jobId: str


STATUS = Literal["queued", "processing", "errored", "completed", "unknown_job", "unknown", "stopped"]


class JobProgressResp(BaseModel):
    status: STATUS
    jobId: Optional[str] = Field(default=None)
    message: Optional[str] = Field(default=None)
    error: Optional[str] = Field(default=None)
    elapsedSeconds: Optional[int] = Field(default=None)
    remainingSeconds: Optional[int] = Field(default=None)
    outputFilepath: Optional[str] = Field(default=None)
    inputFilepath: Optional[str] = Field(default=None)  # this could be the converted youtube path
    preDeechoVocalsFile: Optional[str] = Field(default=None)
    originalVocalsPath: Optional[str] = Field(default=None)
    convertedVocalsPath: Optional[str] = Field(default=None)
    instrumentalsPath: Optional[str] = Field(default=None)
    options: Optional[CreateSongOptions] = Field(default=None)
    modelId: Optional[str] = Field(default=None)
    songHash: Optional[str] = Field(default=None)
    trackName: Optional[str] = Field(default=None)


class JobsResp(BaseModel):
    jobs: List[JobProgressResp] = Field(default=...)


class ShutdownResp(BaseModel):
    success: bool = Field(default=True)


class TorchDevice(BaseModel):
    device: DEVICE = Field(default=...)


MODEL_TYPES = Literal[DEMUCS_ARCH_TYPE, MDX_ARCH_TYPE, VR_ARCH_TYPE]


class StemmingModel(BaseModel):
    name: str
    files: List[str]
    type: MODEL_TYPES


class StemmingModelsResp(BaseModel):
    models: List[StemmingModel] = Field(default=...)


class HealthResp(BaseModel):
    ok: bool = Field(default=True)


class DeviceOptionsResp(BaseModel):
    devices: List[str] = Field(default=...)


class SetDeviceReq(BaseModel):
    device: str = Field(default=...)
