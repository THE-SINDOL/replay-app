import { isLinux, isMacArm, isMacX64, isWindows } from "./utils/constants";
import logger from "../shared/logger";
import { app, dialog, shell } from "electron";

const getSubdomain = () => {
  if (isWindows) {
    return "updates-windows";
  }

  if (isMacX64) {
    return "updates-mac-x64";
  }
  if (isMacArm) {
    return "updates-mac-arm64";
  }
  if (isLinux) {
    return "updates-linux";
  }
};

// autoUpdater.on("update-downloaded", () => {
//   // Should never get here for Windows users, but just in case
//   if (isMac) {
//     autoUpdater.quitAndInstall();
//   }
// });

export default async function checkForUpdates() {
  try {
    if (isLinux) {
      return; // no autoupdate
    }
    if (app.getVersion().includes("development")) {
      return; // dont check for updates on dev builds
    }
    const { autoUpdater } = await import("electron-updater");
    autoUpdater.logger = logger;
    // windows is not signed so it wont work
    // autoUpdater.autoDownload = !isWindows;
    autoUpdater.autoDownload = false;
    autoUpdater.setFeedURL({
      provider: "generic",
      url: `https://${getSubdomain()}.replay-music.xyz`,
    });
    autoUpdater.checkForUpdates();
    autoUpdater.on("error", (error) => {
      const content = error == null ? "unknown" : (error.stack || error).toString();
      if (content.includes("ERR_INTERNET_DISCONNECTED") || content.includes("ERR_CONN_RESET")) {
        logger.info("Internet disconnected, not checking for updates");
        return;
      }
      dialog.showErrorBox("Error checking for update", content);
    });

    autoUpdater.on("update-available", async () => {
      try {
        // if (isMac) {
        //   // Just Install
        //   autoUpdater.downloadUpdate();
        //   return;
        // }
        const resp = await dialog.showMessageBox({
          type: "info",
          title: "New Update Available",
          message: "New Update Available - would you like to download it now?",
          buttons: ["Not now", "Yes"],
          cancelId: 1,
        });
        if (resp.response === 1) {
          // Redirect to the download page
          const platform = isWindows ? "windows" : isMacX64 ? "mac_x64" : isMacArm ? "mac" : "linux";
          shell.openExternal(`https://tryreplay.io/download?platform=${platform}`);
        }
      } catch (e) {
        logger.error(e);
      }
    });
  } catch (e) {
    logger.error(e);
  }
}
