import { exposeElectronTRPC } from "electron-trpc/main";
import { contextBridge, ipcRenderer } from "electron";
import "@sentry/electron/preload";
import arg from "arg";

process.once("loaded", () => {
  exposeElectronTRPC();
});

const resourcesKey = "--RESOURCES_PATH";
const isSettingsKey = "--IS_SETTINGS";
const deviceIdKey = "--DEVICE_ID";
const args = arg(
  {
    [resourcesKey]: String,
    [isSettingsKey]: String,
    [deviceIdKey]: String,
  },
  { permissive: true, argv: process.argv.slice(2) },
);

try {
  const resourcesPath = args[resourcesKey];
  const deviceIdArg = args[deviceIdKey];
  const isSettingsArg = args[isSettingsKey];

  if (resourcesPath) {
    contextBridge.exposeInMainWorld("paths", {
      RESOURCES_PATH: JSON.parse(resourcesPath),
    });
  }
  const isSettings = isSettingsArg === "true";

  const deviceId = JSON.parse(deviceIdArg || "");
  contextBridge.exposeInMainWorld("config", {
    isSettings,
    deviceId,
  });
  ipcRenderer.on("clear-cache", () => {
    console.log("dispatching clear-cache");
    window.dispatchEvent(new Event("clear-cache"));
  });
  // contextBridge.exposeInMainWorld("fs", fs);
  // contextBridge.exposeInMainWorld("Buffer", Buffer);
} catch (e) {
  console.error(e);
}
