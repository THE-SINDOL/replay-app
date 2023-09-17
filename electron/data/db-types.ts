import type { CreateSongOptions } from "@replay/shared/clients/type-utils.ts";
import type { Components } from "@replay/shared/clients/types";
type JobProgressResp = Components.Schemas.JobProgressResp;
export interface SavedSong {
  modelId: string;
  modelName?: string;
  dateCompleted?: number;
  dateStarted: number;
  displayName?: string;
  invalid?: boolean;
  id: string;
  jobId: string;
  songHash?: string;
  modelPath?: string;
  originalFilePath: string;
  originalRawInput: string;
  youtubeUrl?: string;
  outputDirectory?: string;
  shareId?: string;
  songPath?: string;
  originalVocalsPath?: string;
  convertedVocalsPath?: string;
  instrumentalsPath?: string;
  status: JobProgressResp["status"];
  parsedTrackName?: string;
  preDeechoVocalsFile?: string;
  weightsPath?: string;
  options?: CreateSongOptions;
}
