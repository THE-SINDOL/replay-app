import { BrowserWindow, screen } from "electron";
import { join } from "path";
import { windows } from "../index";
import { isMac } from "../utils/constants";
import { RESOURCES_PATH } from "../constants.ts";
import { createIPCHandler } from "electron-trpc/main";
import { router } from "@replay/api/api.ts";
import { db } from "../data/database.ts";

const windowWithinBounds = (windowState: WindowState, bounds: Electron.Rectangle) => {
  return (
    windowState.x >= bounds.x &&
    windowState.y >= bounds.y &&
    windowState.x + windowState.width <= bounds.x + bounds.width &&
    windowState.y + windowState.height <= bounds.y + bounds.height
  );
};

interface WindowState {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const getDefaultWindowOptions = (isSettings?: boolean): Partial<Electron.BrowserWindowConstructorOptions> => {
  return {
    visualEffectState: "active",
    ...(isMac
      ? {
          vibrancy: "sidebar",
          titleBarStyle: "hiddenInset",
          frame: false,
          hasShadow: true,
          transparent: true,
        }
      : {}),
    title: "Replay",
    webPreferences: {
      nodeIntegration: true,
      devTools: true,
      webSecurity: false,
      contextIsolation: true,
      allowRunningInsecureContent: false,
      sandbox: false,
      preload: join(__dirname, "utils/preload.js"),
      nodeIntegrationInWorker: true,
      nodeIntegrationInSubFrames: true,
      javascript: true,
      additionalArguments: [
        `--RESOURCES_PATH=${JSON.stringify(RESOURCES_PATH)}`,
        `--IS_SETTINGS=${!!isSettings}`,
        `--DEVICE_ID=${JSON.stringify(db.getDeviceId())}`,
      ],
    },
  } as Partial<Electron.BrowserWindowConstructorOptions>;
};

const handler = createIPCHandler({ router });

export default function createWindow(options: Partial<Electron.BrowserWindowConstructorOptions>, isSettings?: boolean) {
  const bounds = screen.getPrimaryDisplay().bounds;
  const defaultSize = {
    width: options.width ?? 0,
    height: options.height ?? 0,
    x: options.x ?? (bounds.width - (options.width ?? 400)) / 2,
    y: options.y ?? (bounds.width - (options.width ?? 400)) / 2,
  };
  const resetToDefaults = (): WindowState => {
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2,
    });
  };
  const ensureVisibleOnSomeDisplay = (): WindowState => {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(defaultSize, display.bounds);
    });
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults();
    }
    return defaultSize;
  };

  const state = ensureVisibleOnSomeDisplay();
  const defaultOptions = getDefaultWindowOptions(isSettings);
  const win = new BrowserWindow({
    ...defaultOptions,
    ...options,
    ...state,
    webPreferences: {
      ...defaultOptions.webPreferences,
      ...options.webPreferences,
    },
  });
  windows.push(win);

  handler.attachWindow(win);
  win.on("close", () => {
    handler.detachWindow(win);
  });

  return win;
}
