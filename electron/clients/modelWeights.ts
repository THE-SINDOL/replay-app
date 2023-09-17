import axios from "axios";
import logger from "../../shared/logger";
import { localModelPath } from "../utils/constants";
import type { AxiosProgressEvent } from "axios";
import path from "path";
import jetpack from "fs-jetpack";
import fs from "fs";
import decompress from "decompress";
import { listFiles } from "@huggingface/hub";
import { db } from "../data/database";
import { partition } from "lodash-es";
import huggingFaceData from "../data/huggingFaceClassification.json" assert { type: "json" };
import fsp from "fs/promises";
import { startCase } from "lodash-es";
import { httpAgent, httpsAgent } from "./agents.ts";
import { withRetries } from "../utils/util.ts";
import { shell } from "electron";
interface RemoteModelWeight {
  id: string;
  last_modified: string;
  size: number;
  name?: string;
  isHighQuality?: boolean;
  metadata?: Metadata;
}
export interface VoiceModelWeight {
  id: string;
  name: string;
  last_modified: Date | undefined;
  size: number;
  metadata?: Metadata;
  isHighQuality?: boolean;
}
interface Metadata {
  classification: string;
  epochs: number;
  extra_info: Record<string, any>;
  model?: string;
}

const WEIGHTS_URL = "https://models.replay-music.xyz/models.json";

export interface ArtistModelOption extends VoiceModelWeight {
  downloaded: boolean;
}
class ModelWeights {
  progress: Record<string, AxiosProgressEvent | null> = {};
  error: Record<string, object> = {};

  weights: VoiceModelWeight[] = [];
  huggingFaceModels: VoiceModelWeight[] = [];
  constructor() {
    this.getRemoteWeightOptions();
  }
  removeModels = async () => {
    const files = await this.getLocallyDownloadedModelFiles();
    await Promise.all(files.map((file) => jetpack.removeAsync(path.join(localModelPath, file.name))));
  };
  removeModelByName = async (name: string) => {
    const files = await this.getLocallyDownloadedModelFiles();
    const nameToFind = name.toLowerCase().trim();
    const file = files.find((f) => f.name.toLowerCase().trim() === nameToFind);
    if (file) {
      await jetpack.removeAsync(path.join(localModelPath, file.name));
    }
  };

  showModelInFinderByName = async (name: string) => {
    const files = await this.getLocallyDownloadedModelFiles();
    const nameToFind = name.toLowerCase().trim();
    const file = files.find((f) => f.name.toLowerCase().trim() === nameToFind);
    if (file) {
      shell.showItemInFolder(path.join(localModelPath, file.name));
    }
  };
  repo = "juuxn/RVCModels";
  setRemoteModelWeights = (weights: RemoteModelWeight[]) => {
    const newWeights = weights.map((l) => {
      const fileName = path.parse(l.id).name;
      const huggingFaceMeta = huggingFaceData[l.id] || huggingFaceData[fileName];
      const name = l.name || huggingFaceMeta?.name || fileName;
      const metadata = l.metadata || huggingFaceMeta;
      const lastModified = l.last_modified ? new Date(l.last_modified) : undefined;
      return { ...l, id: fileName, name, last_modified: lastModified, metadata };
    });
    this.weights = newWeights;
  };

  getModelNameFromId = (id: string | null) => {
    if (!id) {
      return "";
    }
    const model = this.weights.find((l) => l.id === id) || this.weights.find((l) => path.parse(l.id).name === id);
    return model?.name || startCase(id);
  };
  getRemoteWeightOptionsPromise: Promise<VoiceModelWeight[]> | null = null;
  getRemoteWeightOptions = async (force?: boolean) => {
    if (!this.getRemoteWeightOptionsPromise || force) {
      this.getRemoteWeightOptionsPromise = this.getRemoteWeightOptionsInternal(force);
    }
    return await this.getRemoteWeightOptionsPromise;
  };
  private getRemoteWeightOptionsInternal = async (force?: boolean) => {
    if (force || this.weights.length === 0) {
      try {
        const response = await axios.get<RemoteModelWeight[]>(WEIGHTS_URL);
        this.setRemoteModelWeights(response.data);
      } catch (e) {
        logger.error(e);
      }
    }

    if (force || !this.huggingFaceModels.length) {
      const huggingFaceToken = db.getHuggingFaceToken();
      if (huggingFaceToken) {
        try {
          const remoteFiles = listFiles({
            repo: this.repo,
            credentials: { accessToken: huggingFaceToken },
          });
          const huggingFaceModels: VoiceModelWeight[] = [];
          for await (const fileInfo of remoteFiles) {
            if (fileInfo.type === "file" && fileInfo.path.endsWith("zip")) {
              const metadata = huggingFaceData[fileInfo.path] || huggingFaceData[fileInfo.path.slice(0, -4)];
              huggingFaceModels.push({
                id: fileInfo.path,
                name: metadata?.name || path.parse(fileInfo.path).name,
                last_modified: undefined,
                size: fileInfo.size,
                metadata,
              });
            }
          }
          this.huggingFaceModels = huggingFaceModels;
        } catch (e) {
          logger.error(`Error loading hugging face models`);
        }
      } else {
        this.huggingFaceModels = [];
      }
    }

    return [...this.weights, ...this.huggingFaceModels];
  };
  getLocallyDownloadedModelFiles = async (): Promise<fs.Dirent[]> => {
    if (process.env.ELECTRON) {
      const files = (await fsp.readdir(localModelPath, { withFileTypes: true })) || [];
      const dirs = files.filter((l) => l.isDirectory());
      return dirs;
    }
    return [];
  };

  getWeightOptions = async (localOnly?: boolean): Promise<ArtistModelOption[]> => {
    const remoteWeights = localOnly ? [] : await this.getRemoteWeightOptions();
    const localWeights = await this.getLocallyDownloadedModelFiles();
    const remoteWeightOptions = remoteWeights.map((weight) => {
      let downloaded = true;
      if (process.env.ELECTRON) {
        if (this.progress[weight.id]) {
          downloaded = false;
        } else {
          const dirName = path.parse(weight.id).name;
          downloaded = Boolean(localWeights.find((l) => l.name === dirName));
        }
      }
      const name = weight.name || path.parse(weight.id).name;

      return {
        ...weight,
        name,
        downloaded,
        size: weight.size,
        metadata: weight.metadata,
      } as ArtistModelOption;
    });
    const remoteWeightIds = new Set(remoteWeightOptions.map((l) => path.parse(l.id).name));
    const localWeightOptions = localWeights
      .filter((l) => {
        return !remoteWeightIds.has(l.name) && !remoteWeightIds.has(path.parse(l.name).name);
      })
      .map((fileInfo) => {
        const weight = fileInfo.name;
        const metadata = huggingFaceData[weight] || huggingFaceData[path.parse(weight).name];
        return {
          id: weight,
          name: metadata?.name || weight,
          downloaded: true,
          metadata,
          size: 0,
          last_modified: undefined,
        };
      });
    const allValidWeights = [remoteWeightOptions, localWeightOptions].flat().filter((l) => l.name.trim());
    const sorted = allValidWeights.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      return 1;
    });
    const [downloaded, notDownloaded] = partition(sorted, (e) => e.downloaded);
    return [downloaded, notDownloaded].flat();
  };

  addLocalModel = async (filePath: string) => {
    const exists = await jetpack.existsAsync(filePath);
    if (!exists) {
      throw new Error("File does not exist");
    }
    const fileOrDirName = path.parse(filePath).name.toLowerCase();
    const newLocalModelDir = path.join(localModelPath, fileOrDirName);
    if (exists === "file" && filePath.endsWith(".zip")) {
      await decompress(filePath, newLocalModelDir);
    } else if (exists === "dir") {
      await jetpack.copyAsync(filePath, newLocalModelDir);
    } else if (exists == "file" && filePath.endsWith(".pth")) {
      // this is pretty annoying - the filePath will either end with a .pth or a .zip
      // html5 filedropper cant distinguish between files and folders,
      // so we need to figure out if we're going to use the folder name or file name for this, and copy all pths into this folder
      // so if they have a downloads folder with a ton of pth files, we'd either copy over all of them or miss out on the _g and _d ones
      // for now, we decide to skip out on _d and _g and just copy over pth + index files

      const dirname = path.dirname(filePath);
      const files = await jetpack.findAsync(dirname, { matching: "*.index", ignoreCase: true });
      // create newLocalModelDir
      await jetpack.dirAsync(newLocalModelDir);
      // copy pth file
      await jetpack.copyAsync(filePath, path.join(newLocalModelDir, path.basename(filePath)));
      // copy all index files into newLocalModelDir
      await Promise.all(files.map((file) => jetpack.copyAsync(file, path.join(newLocalModelDir, path.basename(file)))));
    }
    // now verify that at least one pth file exists
    const pthFiles = await jetpack.findAsync(newLocalModelDir, {
      matching: "*.pth",
      recursive: true,
      ignoreCase: true,
    });
    if (!pthFiles.length) {
      await jetpack.removeAsync(newLocalModelDir);
      throw new Error("Model does not contain a pth file");
    }
    const weights = await this.getWeightOptions();
    const newModel = weights.find((w) => w.id === fileOrDirName);
    return newModel;
  };
  download = async (model: ArtistModelOption) => {
    const id = model.id;
    if (id in this.progress) {
      logger.info(`Already downloading ${id}`);
      return false;
    }
    const zipName = `${id}.zip`;
    const object = this.weights.find((w) => w.id === id);
    if (!object) {
      logger.error(`Could not find model to download - ${zipName}`);
      return false;
    }

    const url = `https://models.replay-music.xyz/${zipName}`;

    try {
      this.progress[id] = {
        loaded: 0,
        total: 0,
      } as AxiosProgressEvent;
      return withRetries<boolean>(
        () =>
          new Promise<boolean>(async (resolve, reject) => {
            const response = await axios.get(url, {
              responseType: "stream",
              onDownloadProgress: (progressEvent) => {
                this.progress[id] = progressEvent;
              },
              httpsAgent,
              httpAgent,
            });
            const zipFilePath = path.join(localModelPath, zipName);
            const writeStream = fs.createWriteStream(zipFilePath, { flags: "w" });
            response.data.pipe(writeStream);
            response.data.on("end", async () => {
              // unzip file

              // we have some duplicate filenames with different hashes unfortunately // calculate md5 sum for the downloaded file
              // const hash = crypto.createHash("md5");
              // const fileBuffer = await fs.promises.readFile(zipFilePath);
              // hash.update(fileBuffer);
              // const md5sum = hash.digest("hex");
              //
              // // compare md5 sums
              // let modelSum = modelSums[zipName];
              // if (modelSum && modelSum !== md5sum) {
              //   delete this.progress[id];
              //   logger.error(`Checksum mismatch for ${id}, expected ${modelSum} got ${md5sum}`);
              //   this.error[id] = new Error("Checksum mismatch");
              //   reject();
              // }
              logger.info(`Downloaded ${zipName}`);
              await decompress(zipFilePath, path.join(localModelPath, path.parse(zipName).name));
              await jetpack.removeAsync(zipFilePath);
              delete this.progress[id];
              resolve(true);
              logger.info(`Unzipped ${zipName}`);
            });
            response.data.on("error", (error: any) => {
              delete this.progress[id];
              logger.error(error);
              this.error[id] = error;
              reject();
            });
          }),
      );
    } catch (e) {
      logger.error(e);
    }
  };
}

export const WeightDownloader = new ModelWeights();
