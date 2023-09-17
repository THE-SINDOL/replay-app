import type { MenuItemConstructorOptions } from "electron";
import { app, dialog, Menu, shell, systemPreferences } from "electron";
import { windows } from "../index";
import { showApp, showSettings } from "../utils/util";
import logger, { logPath } from "../../shared/logger";
import { requiredFilesController } from "../clients/required-files-downloader.ts";
import { WeightDownloader } from "../clients/modelWeights.ts";
import jetpack from "fs-jetpack";
import { localAudioDir, localModelPath, localOutputsPath } from "../utils/constants";
import pythonService from "../clients/pythonService.ts";
import { DESKTOP_VERSION, localAppDir } from "../utils/import-before-all-import.ts";

export const getMenu = () => {
  const viewLogs = {
    label: "View Logs",
    type: "normal",
    click: () => {
      shell.showItemInFolder(logPath);
    },
  } as MenuItemConstructorOptions;
  const submitIssue = {
    label: "Submit an Issue",
    type: "normal",
    click: () => {
      shell.openExternal("https://github.com/tryreplay/replay-issues");
    },
  } as MenuItemConstructorOptions;
  const confirm = (cb: () => void | Promise<void>) => {
    return async () => {
      const resp = await dialog.showMessageBox({
        type: "warning",
        buttons: ["Cancel", "Confirm"],
        title: "Confirm",
        message: "Are you sure? This action cannot be undone.",
        defaultId: 0,
        cancelId: 0,
      });
      if (resp.response === 1) {
        cb();
      }
    };
  };
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: "&App",
      submenu: [
        {
          label: "Show App",
          type: "normal",
          click: showApp,
        },
        {
          label: "Show Settings",
          type: "normal",
          click: showSettings,
        },
        { type: "separator" },
        {
          label: "Force restart server",
          type: "normal",
          click: async () => {
            await pythonService.restartServer();
          },
        },
        {
          label: "Stop server",
          type: "normal",
          click: async () => {
            await pythonService.stopServer();
          },
        },
        { type: "separator" },
        {
          label: "Request Microphone Permissions",
          type: "normal",
          click: async () => {
            if (systemPreferences.askForMediaAccess) {
              await systemPreferences.askForMediaAccess("microphone");
            }
          },
        },
        {
          label: "Clear UI Cache",
          type: "normal",
          click: async () => {
            windows.forEach((w) => w.webContents.send("clear-cache"));
          },
        },
        { type: "separator" },
        {
          label: "Submit Feedback",
          type: "normal",
          click: () => {
            shell.openExternal("https://discord.gg/A5rgNwDRd4");
          },
        },
        submitIssue,
        { type: "separator" },
        viewLogs,
        { type: "separator" },
        {
          label: "Quit",
          type: "normal",
          click: async () => {
            app.quit();
          },
        },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        {
          label: `Replay v${DESKTOP_VERSION}`,
          type: "normal",
        },
      ],
    },
    {
      label: "&Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut", registerAccelerator: false },
        { role: "copy", registerAccelerator: false },
        { role: "paste", registerAccelerator: false },
        { role: "pasteAndMatchStyle", registerAccelerator: false },
        { role: "delete" },
        { role: "selectAll" },
      ],
    },
    {
      label: "Local Data",
      submenu: [
        {
          label: "View RVC Models",
          type: "normal",
          click: () => {
            shell.showItemInFolder(localModelPath);
          },
        },
        {
          label: "View outputs",
          type: "normal",
          click: () => {
            shell.showItemInFolder(localOutputsPath);
          },
        },
        { type: "separator" },
        {
          label: "Remove all base models",
          type: "normal",
          click: confirm(async () => {
            await requiredFilesController.removeModelWeights();
            app.relaunch();
            app.quit();
          }),
        },
        {
          label: "Remove local server",
          type: "normal",
          click: confirm(async () => {
            await pythonService.removeLocalServer();
            app.relaunch();
            app.quit();
          }),
        },
        {
          label: "Remove all artist models",
          type: "normal",
          click: confirm(async () => {
            await WeightDownloader.removeModels();
          }),
        },
        {
          label: "Remove all created songs",
          type: "normal",
          click: confirm(async () => {
            await jetpack.removeAsync(localAudioDir);
            await jetpack.removeAsync(localOutputsPath);
            app.relaunch();
            app.quit();
          }),
        },
        {
          label: "Remove all app data",
          type: "normal",
          click: confirm(async () => {
            await WeightDownloader.removeModels();
            await requiredFilesController.removeModelWeights();
            await jetpack.removeAsync(localAppDir);
            app.relaunch();
            app.quit();
          }),
        },
      ],
    },
    {
      label: "&View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { type: "separator" },
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
      ],
    },
    {
      label: "&Window",
      role: "window",
      submenu: [{ role: "minimize" }, { role: "close" }],
    },
    {
      label: "&Help",
      role: "help",
      submenu: [viewLogs, submitIssue],
    },
  ];

  const macMenu: MenuItemConstructorOptions = {
    label: "Replay",
    submenu: [
      { role: "about" },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      {
        label: "Quit",
        accelerator: "CmdOrCtrl+Q",
        click: () => {
          logger.info("Cmd + Q is pressed");
          windows.forEach((win) => win.close());
          app.quit();
        },
      },
    ],
  };
  menuTemplate.unshift(macMenu);

  // Window menu
  const windowMenu = menuTemplate.find((l) => l.role === "window");
  if (windowMenu) {
    windowMenu.submenu = [
      { role: "close" },
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" },
    ];
  }

  return Menu.buildFromTemplate(menuTemplate);
};
