import { resolve } from "path";
import path from "path";
import fs from "fs/promises";
import { notarize } from "./notarize-utils";

const run = async () => {
  if (process.platform !== "darwin") {
    console.log("Skipping notarization - not building for Mac");
    return;
  }

  if (!process.env.APPLE_ID) {
    console.log("Skipping notarization - no apple id");
    return;
  }
  console.log("Notarizing...");
  const now = Date.now();
  const folderWeAreLookingFor = "dist";

  let absDir = path.join(__dirname, folderWeAreLookingFor);
  // check if the directory exists
  const maxDir = 10;
  let dirUp = 0;
  while (absDir !== "/" && dirUp < maxDir) {
    try {
      await fs.access(absDir, fs.constants.F_OK);
      break;
    } catch (err: any) {
      absDir = path.join(absDir, "../..", folderWeAreLookingFor);
      dirUp++;
    }
  }

  if (dirUp == maxDir) {
    console.error("Could not find dist folder");
    process.exit(1);
  }

  const builds = await fs.readdir(absDir);

  const paths: string[] = [];
  for (const dir of builds) {
    const path = resolve(absDir, dir);
    const stat = await fs.lstat(path);
    if (stat.isDirectory()) {
      const subPaths = (await fs.readdir(path)).map((l) => resolve(path, l));
      paths.push(...subPaths);
    }
  }

  const apps = paths.filter((path) => path.endsWith(".app"));

  const notaries = apps.map(async (app) => {
    try {
      return await notarize({
        tool: "notarytool",
        teamId: "F35YQQ5672",
        appPath: app,
        appleId: process.env.APPLE_ID!,
        appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD || process.env.APPLE_ID_PASSWORD!,
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  await Promise.all(notaries);
  const timeTaken = (Date.now() - now) / 1000;
  console.log(`Notarization complete - took ${timeTaken}s`);
};
export default run;
