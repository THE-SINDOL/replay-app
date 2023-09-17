// important to import this before all other imports
// so that we set the app path correctly
import { app } from "electron";
import path from "path";
import fs from "fs-extra";
import packageJson from "../../package.json";
import isDev from "electron-is-dev";

export const DESKTOP_VERSION = isDev ? "dev" : app.getVersion();
export const appId = packageJson.build.appId;

app.setName("Replay");

const originalUserDataDir = app.getPath("userData");
const baseConfigNeverMoved = path.join(originalUserDataDir, "replay-base-config.json");
let actualUserDataDir = originalUserDataDir;
try {
  const savedFilesExists = fs.existsSync(baseConfigNeverMoved);
  if (savedFilesExists) {
    const savedData = fs.readFileSync(baseConfigNeverMoved, "utf8");
    const { newDir } = JSON.parse(savedData);
    actualUserDataDir = newDir;
  }
} catch (e) {
  console.error(`Error in import-before-all-import.ts`);
  console.error(e);
}

export const setNewAppDataDir = (newDir: string) => {
  const basename = path.basename(newDir);
  if (basename === appId) {
    newDir = path.dirname(newDir);
  }
  fs.writeFileSync(baseConfigNeverMoved, JSON.stringify({ newDir }));
  app.relaunch();
  app.quit();
};

export const getLocalDataDir = (base: string) => path.join(base, appId);

export const localAppDir = getLocalDataDir(actualUserDataDir);
