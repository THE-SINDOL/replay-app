import "./utils/import-before-all-import";
import "./utils/flags";
import { app, Menu, nativeTheme, protocol, shell } from "electron";
import type { CustomScheme } from "electron";
import isDev from "electron-is-dev";
import { getDeferred, installExtensions, showApp, showErrorAlert } from "./utils/util";
import registerContextMenu from "electron-context-menu";
import { getMenu } from "./window/menu";

// todo - do fewer of these imports in this file to improve startup time
import { mainAppIconDevPng } from "./constants";
import logger, { logPath } from "../shared/logger";
import { ensureLocalDirs } from "./utils/constants";
import pythonService from "./clients/pythonService";
import { db } from "./data/database";
import * as Sentry from "@sentry/electron/main";
import { DESKTOP_VERSION } from "./utils/import-before-all-import.ts";
import { IPCMode } from "@sentry/electron/main";
import checkForUpdates from "./autoUpdater.ts";

registerContextMenu({
  showSaveImageAs: true,
  showSaveVideo: true,
  showSaveImage: true,
  showSaveVideoAs: true,
  showCopyLink: true,
  showSaveLinkAs: true,
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
export const windows: Electron.BrowserWindow[] = [];

let errorTries = 0;
const MAX_ERROR_TRIES = 5;

const amMainInstance = app.requestSingleInstanceLock();

logger.info(`Starting logging to ${logPath}`);
if (!amMainInstance) {
  logger.info("Not the main instance - quitting");
  app.quit();
} else {
  logger.info(`--- Launching Replay v${DESKTOP_VERSION} ---\n`);
  // Custom Mac OS dock image
  if (isDev) {
    app.dock?.setIcon(mainAppIconDevPng);
  }
  if (!isDev) {
    // run this async
    // Main process recording
    try {
      Sentry.init({
        dsn: "https://cdab041617b5aeb581112254c8cfcfac@o4505627195015168.ingest.sentry.io/4505627196260352",
        release: DESKTOP_VERSION,
        environment: process.env.NODE_ENV,
        attachScreenshot: true,
        attachStacktrace: true,
        sendDefaultPii: true,
        ipcMode: IPCMode.Protocol,
      });
    } catch (e) {
      logger.error(e);
    }
  }

  app.on("web-contents-created", (_event, contents) => {
    contents.on("render-process-gone", (_event, details) => {
      if (details.reason === "clean-exit") {
        return;
      }
      logger.error(`UI crashed: ${details.reason}`);

      showErrorAlert("UI crashed", "The UI stopped unexpected.");

      setImmediate(() => {
        if (errorTries < MAX_ERROR_TRIES) {
          logger.error("Retrying UI");
          errorTries += 1;
          contents.reload();
        } else {
          logger.error("Too many errors - quitting");
          showErrorAlert("Too many errors", "Too many errors - quitting");
          app.quit();
        }
      });
    });
    contents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
  });

  const customSchemes = ["file", "replay-asset", "devtools", "sentry-ipc"].map((s) => ({
    scheme: s,
    privileges: {
      secure: true,
      standard: true,
      allowServiceWorkers: true,
      stream: true,
      bypassCSP: true,
      corsEnabled: true,
      supportFetchAPI: true,
    },
  })) as CustomScheme[];
  protocol.registerSchemesAsPrivileged(customSchemes);
  const appReady = getDeferred();
  app.on("ready", async () => {
    if (isDev && !process.argv.includes("--noDevExtensions")) {
      await installExtensions();
    }
    // ensure the dir exists
    await ensureLocalDirs();
    await db.init();
    const deviceId = db.getDeviceId();
    logger.info(`Device ID: ${deviceId}`);
    Sentry.setUser({ id: deviceId });
    pythonService.pythonServerIsValidFast().then((isValid) => {
      logger.info(`Python server valid: ${isValid}`);
    });
    nativeTheme.themeSource = "dark";
    appReady.resolve();
  });

  appReady.promise.then(() => {
    try {
      Menu.setApplicationMenu(getMenu());
    } catch (e) {
      showErrorAlert("Error", "Error setting menu");
    }
    try {
      showApp();
    } catch (e) {
      logger.error(`Error showing app: ${e}`);
      showErrorAlert("Window creation error", "Unable to create main window");
    }

    // Check for updates, notify for windows and auto-install for Mac
    try {
      checkForUpdates();
    } catch (e) {
      logger.error(`Error checking for updates: ${e}`);
    }
  });

  // We use a single process instance to manage the server, but we
  // do allow multiple windows.
  app.on("second-instance", () => appReady.promise.then(() => showApp()));

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (windows.length === 0) {
      // Wait until the ready event - it's possible that this can fire
      // before the app is ready (not sure how) in which case things break!
      appReady.promise.then(() => showApp());
    }
  });
  app.on("will-quit", () => {
    logger.info("Closing");
    logger.close();
  });
}
process
  .on("unhandledRejection", (reason, p) => {
    logger.error(`Unhandled Rejection at: ${p} reason: ${reason}`);
  })
  .on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err}`);
  });
