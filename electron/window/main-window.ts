import { shell, type BrowserWindow, screen } from "electron";
import windowStateKeeper from "electron-window-state";
import createWindow from "./create-window";
import { mainAppIconDevPng } from "../constants";
import isDev from "electron-is-dev";
import { format } from "url";
import { windows } from "../index";

import logger, { uiLogger } from "../../shared/logger";
import { join } from "path";
const logKeys = ["debug", "info", "warn", "error"] as const;
const setupBaseWindowEventHandlers = (window: BrowserWindow) => {
  window.webContents.on("console-message", (_event: any, level: number, message: string) => {
    const levelName = logKeys[level];
    const loggerCall = uiLogger[levelName];
    (loggerCall || uiLogger.info)(message || "");
  });

  window.on("ready-to-show", function () {
    window!.show();
    window!.focus();
  });

  window.on("closed", () => {
    const index = windows.indexOf(window);
    if (index > -1) {
      windows.splice(index, 1);
    }
  });

  // Open external links in the browser
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
};

const getUrl = (query?: string) => {
  if (isDev) {
    const baseUrl = new URL("http://localhost:9080/");
    if (query) {
      baseUrl.search = query;
    }
    return baseUrl.href;
  }
  const pathname = join(__dirname, "../../../ui/out/index.html");
  logger.info(`Loading UI from ${pathname}`);
  const url = format({
    pathname,
    protocol: "file:",
    slashes: true,
  });
  return url + (query || "");
};

export const createMainWindow = async () => {
  const windowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 1000,
  });

  const mainWindow = createWindow({
    title: "Replay",
    minWidth: 930,
    minHeight: 640,
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    icon: mainAppIconDevPng,
  });

  windowState.manage(mainWindow);

  const url = getUrl();

  setupBaseWindowEventHandlers(mainWindow);
  await mainWindow.loadURL(url);
  try {
    if (isDev || process.argv.includes("--devTools")) {
      mainWindow.webContents.openDevTools({ mode: "undocked" });
    }
  } catch (e) {
    logger.error(`Error opening devtools: ${e}\n`);
  }
  mainWindow.show();
  return mainWindow;
};

export const createSettingsWindow = async () => {
  const bounds = screen.getPrimaryDisplay().bounds;
  const width = 800;
  const height = 600;

  const settingsWindow = createWindow(
    {
      title: "Settings",
      width,
      height,
      x: (bounds.width - width) / 2,
      y: (bounds.height - height) / 2,
      icon: mainAppIconDevPng,
      resizable: false,
    },
    true,
  );

  const url = getUrl("?settings=true");
  setupBaseWindowEventHandlers(settingsWindow);
  await settingsWindow.loadURL(url);
  try {
    if (isDev || process.argv.includes("--devTools")) {
      settingsWindow.webContents.openDevTools({ mode: "undocked" });
    }
  } catch (e) {
    logger.error(`Error opening devtools: ${e}\n`);
  }
  settingsWindow.show();
  settingsWindow.moveTop();

  return settingsWindow;
};
