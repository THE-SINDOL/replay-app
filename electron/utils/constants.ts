import { localAppDir } from "./import-before-all-import.ts";
import path from "path";

export const localDbPath = path.join(localAppDir, "db.json");
export const localAudioDir = path.join(localAppDir, "recordings");
export const localWeightsPath = path.join(localAppDir, "weights");
export const localModelPath = path.join(localAppDir, "models");
export const localOutputsPath = path.join(localAppDir, "outputs");
export const isWindows = process.platform === "win32";
export const isLinux = process.platform === "linux";
export const isMacArm = process.platform === "darwin" && process.arch === "arm64";
export const isMacX64 = process.platform === "darwin" && !isMacArm;
export const isMac = isMacArm || isMacX64;
export const isElectron = Boolean(process.env.ELECTRON);
export const ensureLocalDirs = async () => {
  const jetpack = await import("fs-jetpack");
  const dirs = [localAppDir, localAudioDir, localWeightsPath, localModelPath, localOutputsPath];
  for (const dir of dirs) {
    await jetpack.dirAsync(dir);
  }
};
