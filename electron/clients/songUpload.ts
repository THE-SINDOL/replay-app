import axios from "axios";
import type { AxiosProgressEvent } from "axios";
import jetpack from "fs-jetpack";
import { Readable } from "stream";

import type { SavedSong } from "../data/db-types.ts";

import FfmpegCommand from "fluent-ffmpeg";
import path from "path";
import { RESOURCES_PATH } from "../constants.ts";
import isDev from "electron-is-dev";
import { isWindows } from "../utils/constants.ts";

class Upload {
  progress: Record<string, AxiosProgressEvent | null> = {};
  error: Record<string, object> = {};

  convertToMp3 = async (filePath: string) => {
    const fileName = path.parse(filePath).name;
    const fileDir = path.dirname(filePath);
    const outputPath = path.join(fileDir, `${fileName}.mp3`);
    const ffmpegBin = isWindows ? "ffmpeg.exe" : "ffmpeg";
    const ffmpegPath = isDev
      ? path.join(RESOURCES_PATH, "node_modules", "ffmpeg-static-fork", ffmpegBin)!
      : path.join(RESOURCES_PATH, "bin", ffmpegBin);
    FfmpegCommand.setFfmpegPath(ffmpegPath);
    const command = FfmpegCommand();
    command.input(filePath).outputOptions("-c:a libmp3lame").output(outputPath);
    return new Promise<string>((resolve, reject) => {
      command.on("end", () => {
        resolve(outputPath);
      });
      command.on("error", (error) => {
        reject(error);
      });
      command.run();
    });
  };
  upload = async (presignedUrl: string, song: SavedSong) => {
    let filePath = song.songPath;

    if (!filePath) {
      throw new Error(`No file path for song ${song.id}`);
    }

    if (!presignedUrl) {
      throw new Error(`No presigned url for song ${song.id}`);
    }
    try {
      if (!filePath.toLowerCase().endsWith(".mp3")) {
        // we need to convert the file to mp3
        filePath = await this.convertToMp3(filePath);
      }
      const fileBuffer = jetpack.read(filePath, "buffer");

      if (!fileBuffer) {
        throw new Error(`Unable to read file at path: ${filePath}`);
      }

      // Convert buffer to stream
      const fileStream = new Readable();
      fileStream.push(fileBuffer);
      fileStream.push(null);

      const response = await axios.put(presignedUrl, fileStream, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": fileBuffer.length,
        },
        onUploadProgress: (progressEvent) => {
          this.progress[song.id] = progressEvent;
        },
      });

      console.log("Song uploaded successfully: ", song.id);
      return response.status;
    } catch (error: any) {
      console.error(`Error ${song.id}:`, error);
      this.error[song.id] = error;
      return 0;
    }
  };
}

export const UploadSong = new Upload();
