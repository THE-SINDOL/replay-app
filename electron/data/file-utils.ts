import jetpack from "fs-jetpack";
import { localAudioDir } from "../utils/constants";
import { requiredFilesController } from "../clients/required-files-downloader.ts";
import path from "path";
import fs from "fs/promises";
import mime from "mime-types";
import pythonService from "../clients/pythonService.ts";

export const hasRequiredFiles = async (fast?: boolean) => {
  const serverValid = fast ? await pythonService.pythonServerIsValidFast() : await pythonService.pythonServerIsValid();
  return serverValid && requiredFilesController.hasDownloadedModelWeights();
};

export const saveAudioFileForProcessing = async (blob: {
  buffer: Uint8Array;
  type: string;
}): Promise<{ url: string } | { error: string }> => {
  const dateTimestring = new Date().toISOString().replaceAll(":", "-");
  const name = `Recorded Audio ${dateTimestring}`;
  const fileExtension = mime.extension(blob.type);
  const fullPath = path.join(localAudioDir, `${name}.${fileExtension || "ogg"}`);
  await jetpack.dirAsync(localAudioDir);
  try {
    await fs.writeFile(fullPath, blob.buffer);
    return { url: fullPath };
  } catch (e: any) {
    return { error: e.toString() };
  }
};
