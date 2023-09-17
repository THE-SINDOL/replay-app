import { app, dialog } from "electron";
import { windows } from "../index";
import { createMainWindow, createSettingsWindow } from "../window/main-window";

import logger from "../../shared/logger";

export interface Deferred<T> {
  resolve: (arg: T) => void;
  reject: (e?: Error) => void;
  promise: Promise<T>;
}

export function getDeferred<T = void>(): Deferred<T> {
  let resolve: undefined | ((arg: T) => void) = undefined;
  let reject: undefined | ((e?: Error) => void) = undefined;

  const promise = new Promise<T>((resolveCb, rejectCb) => {
    resolve = resolveCb;
    reject = rejectCb;
  });

  // TS thinks we're using these before they're assigned, which is why
  // we need the undefined types, and the any here.
  return { resolve, reject, promise } as any;
}

export function showErrorAlert(title: string, body: string) {
  logger.warn(`${title}: ${body}`);
  dialog.showErrorBox(title, body);
}
export const showApp = () => {
  app.dock?.show();
  if (windows.length > 0) {
    windows[0].show();
  } else {
    createMainWindow();
  }
};
export const showSettings = async () => {
  app.dock?.show();
  const settingsWindow = windows.find((w) => w.webContents.getURL()?.toLowerCase()?.includes("?settings"));
  if (settingsWindow) {
    settingsWindow.show();
  } else {
    await createSettingsWindow();
  }
};

export const withRetries = async <T = any>(fn: () => Promise<T>, MAX_ERROR_TRIES = 3) => {
  for (let i = 0; i < MAX_ERROR_TRIES; i++) {
    try {
      return await fn();
    } catch (e) {
      logger.error(e);
      if (i == MAX_ERROR_TRIES - 1) {
        throw e;
      }
    }
  }
};
export const installExtensions = async () => {
  const { installExtension, REACT_DEVELOPER_TOOLS } = await import("electron-extension-installer");

  // to do re-enable this when fixed
  await installExtension(REACT_DEVELOPER_TOOLS, {
    loadExtensionOptions: {
      allowFileAccess: true,
    },
  });
};
