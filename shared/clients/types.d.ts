import type {
  OpenAPIClient,
  Parameters,
  UnknownParamsObject,
  OperationResponse,
  AxiosRequestConfig,
} from "openapi-client-axios";

declare namespace Components {
  namespace Schemas {
    /**
     * ClearJobReq
     */
    export interface ClearJobReq {
      /**
       * Jobid
       */
      jobId: string;
    }
    /**
     * CreateSongOptions
     */
    export interface CreateSongOptionsInput {
      /**
       * Pitch
       */
      pitch?: /* Pitch */ number | null;
      /**
       * Instrumentalspitch
       */
      instrumentalsPitch?: /* Instrumentalspitch */ number | null;
      /**
       * Prestemmed
       */
      preStemmed?: /* Prestemmed */ boolean | null;
      /**
       * Vocalsonly
       */
      vocalsOnly?: /* Vocalsonly */ boolean | null;
      /**
       * Samplemode
       */
      sampleMode?: /* Samplemode */ boolean | null;
      /**
       * Deechodereverb
       */
      deEchoDeReverb?: /* Deechodereverb */ boolean | null;
      /**
       * Samplemodestarttime
       */
      sampleModeStartTime?: /* Samplemodestarttime */ number | null;
      /**
       * F0Method
       */
      f0Method?: /* F0Method */
      ("pm" | "harvest" | "crepe" | "crepe-tiny" | "mangio-crepe" | "mangio-crepe-tiny" | "rmvpe") | null;
      /**
       * Stemmingmethod
       */
      stemmingMethod?: /* Stemmingmethod */ string | null;
      /**
       * Indexratio
       */
      indexRatio?: /* Indexratio */ number | null;
      /**
       * Consonantprotection
       */
      consonantProtection?: /* Consonantprotection */ number | null;
      /**
       * Outputformat
       */
      outputFormat?: /* Outputformat */ ("wav" | "mp3_192k" | "mp3_320k") | null;
      /**
       * Volumeenvelope
       */
      volumeEnvelope?: /* Volumeenvelope */ number | null;
    }
    /**
     * CreateSongOptions
     */
    export interface CreateSongOptionsOutput {
      /**
       * Pitch
       */
      pitch: /* Pitch */ number | null;
      /**
       * Instrumentalspitch
       */
      instrumentalsPitch: /* Instrumentalspitch */ number | null;
      /**
       * Prestemmed
       */
      preStemmed: /* Prestemmed */ boolean | null;
      /**
       * Vocalsonly
       */
      vocalsOnly: /* Vocalsonly */ boolean | null;
      /**
       * Samplemode
       */
      sampleMode: /* Samplemode */ boolean | null;
      /**
       * Deechodereverb
       */
      deEchoDeReverb: /* Deechodereverb */ boolean | null;
      /**
       * Samplemodestarttime
       */
      sampleModeStartTime: /* Samplemodestarttime */ number | null;
      /**
       * F0Method
       */
      f0Method: /* F0Method */
      ("pm" | "harvest" | "crepe" | "crepe-tiny" | "mangio-crepe" | "mangio-crepe-tiny" | "rmvpe") | null;
      /**
       * Stemmingmethod
       */
      stemmingMethod: /* Stemmingmethod */ string | null;
      /**
       * Indexratio
       */
      indexRatio: /* Indexratio */ number | null;
      /**
       * Consonantprotection
       */
      consonantProtection: /* Consonantprotection */ number | null;
      /**
       * Outputformat
       */
      outputFormat: /* Outputformat */ ("wav" | "mp3_192k" | "mp3_320k") | null;
      /**
       * Volumeenvelope
       */
      volumeEnvelope: /* Volumeenvelope */ number | null;
    }
    /**
     * CreateSongReq
     */
    export interface CreateSongReq {
      /**
       * Outputdirectory
       */
      outputDirectory: string;
      /**
       * Modelpath
       */
      modelPath: string;
      /**
       * Weightspath
       */
      weightsPath: string;
      /**
       * Modelid
       */
      modelId?: /* Modelid */ string | null;
      /**
       * Songurlorfilepath
       */
      songUrlOrFilePath: string;
      options?: /* CreateSongOptions */ CreateSongOptionsInput | null;
    }
    /**
     * CreateSongResp
     */
    export interface CreateSongResp {
      /**
       * Jobid
       */
      jobId: string;
    }
    /**
     * DeviceOptionsResp
     */
    export interface DeviceOptionsResp {
      /**
       * Devices
       */
      devices: string[];
    }
    /**
     * HTTPValidationError
     */
    export interface HTTPValidationError {
      /**
       * Detail
       */
      detail?: /* ValidationError */ ValidationError[];
    }
    /**
     * HealthResp
     */
    export interface HealthResp {
      /**
       * Ok
       */
      ok: boolean;
    }
    /**
     * JobProgressReq
     */
    export interface JobProgressReq {
      /**
       * Jobid
       */
      jobId: string;
    }
    /**
     * JobProgressResp
     */
    export interface JobProgressResp {
      /**
       * Status
       */
      status: "queued" | "processing" | "errored" | "completed" | "unknown_job" | "unknown" | "stopped";
      /**
       * Jobid
       */
      jobId: /* Jobid */ string | null;
      /**
       * Message
       */
      message: /* Message */ string | null;
      /**
       * Error
       */
      error: /* Error */ string | null;
      /**
       * Elapsedseconds
       */
      elapsedSeconds: /* Elapsedseconds */ number | null;
      /**
       * Remainingseconds
       */
      remainingSeconds: /* Remainingseconds */ number | null;
      /**
       * Outputfilepath
       */
      outputFilepath: /* Outputfilepath */ string | null;
      /**
       * Inputfilepath
       */
      inputFilepath: /* Inputfilepath */ string | null;
      /**
       * Predeechovocalsfile
       */
      preDeechoVocalsFile: /* Predeechovocalsfile */ string | null;
      /**
       * Originalvocalspath
       */
      originalVocalsPath: /* Originalvocalspath */ string | null;
      /**
       * Convertedvocalspath
       */
      convertedVocalsPath: /* Convertedvocalspath */ string | null;
      /**
       * Instrumentalspath
       */
      instrumentalsPath: /* Instrumentalspath */ string | null;
      options: /* CreateSongOptions */ CreateSongOptionsOutput | null;
      /**
       * Modelid
       */
      modelId: /* Modelid */ string | null;
      /**
       * Songhash
       */
      songHash: /* Songhash */ string | null;
      /**
       * Trackname
       */
      trackName: /* Trackname */ string | null;
    }
    /**
     * JobsResp
     */
    export interface JobsResp {
      /**
       * Jobs
       */
      jobs: /* JobProgressResp */ JobProgressResp[];
    }
    /**
     * SetDeviceReq
     */
    export interface SetDeviceReq {
      /**
       * Device
       */
      device: string;
    }
    /**
     * ShutdownResp
     */
    export interface ShutdownResp {
      /**
       * Success
       */
      success: boolean;
    }
    /**
     * StemmingModel
     */
    export interface StemmingModel {
      /**
       * Name
       */
      name: string;
      /**
       * Files
       */
      files: string[];
      /**
       * Type
       */
      type: "Demucs" | "MDX-Net" | "VR Arc";
    }
    /**
     * StemmingModelsResp
     */
    export interface StemmingModelsResp {
      /**
       * Models
       */
      models: /* StemmingModel */ StemmingModel[];
    }
    /**
     * StopJobReq
     */
    export interface StopJobReq {
      /**
       * Jobid
       */
      jobId: string;
    }
    /**
     * TorchDevice
     */
    export interface TorchDevice {
      /**
       * Device
       */
      device: "cpu" | "cuda" | "xla" | "mps";
    }
    /**
     * ValidationError
     */
    export interface ValidationError {
      /**
       * Location
       */
      loc: (string | number)[];
      /**
       * Message
       */
      msg: string;
      /**
       * Error Type
       */
      type: string;
    }
  }
}
declare namespace Paths {
  namespace ClearJob {
    export type RequestBody = /* ClearJobReq */ Components.Schemas.ClearJobReq;
    namespace Responses {
      export type $200 = any;
      export type $422 = /* HTTPValidationError */ Components.Schemas.HTTPValidationError;
    }
  }
  namespace CreateSong {
    export type RequestBody = /* CreateSongReq */ Components.Schemas.CreateSongReq;
    namespace Responses {
      export type $200 = /* CreateSongResp */ Components.Schemas.CreateSongResp;
      export type $422 = /* HTTPValidationError */ Components.Schemas.HTTPValidationError;
    }
  }
  namespace DeviceOptions {
    namespace Responses {
      export type $200 = /* DeviceOptionsResp */ Components.Schemas.DeviceOptionsResp;
    }
  }
  namespace Health {
    namespace Responses {
      export type $200 = /* HealthResp */ Components.Schemas.HealthResp;
    }
  }
  namespace Index {
    namespace Responses {
      export type $200 = /* HealthResp */ Components.Schemas.HealthResp;
    }
  }
  namespace Jobs {
    namespace Responses {
      export type $200 = /* JobsResp */ Components.Schemas.JobsResp;
    }
  }
  namespace SetDevice {
    export type RequestBody = /* SetDeviceReq */ Components.Schemas.SetDeviceReq;
    namespace Responses {
      export type $200 = any;
      export type $422 = /* HTTPValidationError */ Components.Schemas.HTTPValidationError;
    }
  }
  namespace Shutdown {
    namespace Responses {
      export type $200 = /* ShutdownResp */ Components.Schemas.ShutdownResp;
    }
  }
  namespace SongProgress {
    export type RequestBody = /* JobProgressReq */ Components.Schemas.JobProgressReq;
    namespace Responses {
      export type $200 = /* JobProgressResp */ Components.Schemas.JobProgressResp;
      export type $422 = /* HTTPValidationError */ Components.Schemas.HTTPValidationError;
    }
  }
  namespace StemmingModels {
    namespace Responses {
      export type $200 = /* StemmingModelsResp */ Components.Schemas.StemmingModelsResp;
    }
  }
  namespace StopJob {
    export type RequestBody = /* StopJobReq */ Components.Schemas.StopJobReq;
    namespace Responses {
      export type $200 = any;
      export type $422 = /* HTTPValidationError */ Components.Schemas.HTTPValidationError;
    }
  }
  namespace TorchDevice {
    namespace Responses {
      export type $200 = /* TorchDevice */ Components.Schemas.TorchDevice;
    }
  }
}

export interface OperationMethods {
  /**
   * index - Index
   */
  "index"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.Index.Responses.$200>;
  /**
   * deviceOptions - Device Options
   */
  "deviceOptions"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.DeviceOptions.Responses.$200>;
  /**
   * setDevice - Set Device
   */
  "setDevice"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.SetDevice.RequestBody,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.SetDevice.Responses.$200>;
  /**
   * health - Health
   */
  "health"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.Health.Responses.$200>;
  /**
   * songProgress - Song Progress
   *
   * Create the song.
   */
  "songProgress"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.SongProgress.RequestBody,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.SongProgress.Responses.$200>;
  /**
   * createSong - Create Song
   *
   * Create the song.
   */
  "createSong"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.CreateSong.RequestBody,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.CreateSong.Responses.$200>;
  /**
   * clearJob - Clear Job
   */
  "clearJob"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.ClearJob.RequestBody,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.ClearJob.Responses.$200>;
  /**
   * stopJob - Stop Job
   */
  "stopJob"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: Paths.StopJob.RequestBody,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.StopJob.Responses.$200>;
  /**
   * jobs - Jobs
   */
  "jobs"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.Jobs.Responses.$200>;
  /**
   * torchDevice - Torch Device
   */
  "torchDevice"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.TorchDevice.Responses.$200>;
  /**
   * stemmingModels - Stemming Models
   */
  "stemmingModels"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.StemmingModels.Responses.$200>;
  /**
   * shutdown - Shutdown
   */
  "shutdown"(
    parameters?: Parameters<UnknownParamsObject> | null,
    data?: any,
    config?: AxiosRequestConfig,
  ): OperationResponse<Paths.Shutdown.Responses.$200>;
}

export interface PathsDictionary {
  ["/"]: {
    /**
     * index - Index
     */
    "get"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.Index.Responses.$200>;
  };
  ["/device_options"]: {
    /**
     * deviceOptions - Device Options
     */
    "get"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.DeviceOptions.Responses.$200>;
  };
  ["/set_device"]: {
    /**
     * setDevice - Set Device
     */
    "post"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.SetDevice.RequestBody,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.SetDevice.Responses.$200>;
  };
  ["/health"]: {
    /**
     * health - Health
     */
    "get"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.Health.Responses.$200>;
  };
  ["/song_progress"]: {
    /**
     * songProgress - Song Progress
     *
     * Create the song.
     */
    "post"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.SongProgress.RequestBody,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.SongProgress.Responses.$200>;
  };
  ["/create_song"]: {
    /**
     * createSong - Create Song
     *
     * Create the song.
     */
    "post"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.CreateSong.RequestBody,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.CreateSong.Responses.$200>;
  };
  ["/clear_job"]: {
    /**
     * clearJob - Clear Job
     */
    "post"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.ClearJob.RequestBody,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.ClearJob.Responses.$200>;
  };
  ["/stop_job"]: {
    /**
     * stopJob - Stop Job
     */
    "post"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: Paths.StopJob.RequestBody,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.StopJob.Responses.$200>;
  };
  ["/jobs"]: {
    /**
     * jobs - Jobs
     */
    "get"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.Jobs.Responses.$200>;
  };
  ["/torch_device"]: {
    /**
     * torchDevice - Torch Device
     */
    "get"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.TorchDevice.Responses.$200>;
  };
  ["/stemming_models"]: {
    /**
     * stemmingModels - Stemming Models
     */
    "get"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.StemmingModels.Responses.$200>;
  };
  ["/shutdown"]: {
    /**
     * shutdown - Shutdown
     */
    "post"(
      parameters?: Parameters<UnknownParamsObject> | null,
      data?: any,
      config?: AxiosRequestConfig,
    ): OperationResponse<Paths.Shutdown.Responses.$200>;
  };
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>;
