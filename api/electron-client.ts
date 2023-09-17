// IMPORTANT: DO NOT IMPORT ANYTHING UP HERE - only do async imports for anything in @replay/electron
import type { ArtistModelOption } from "@replay/electron/clients/modelWeights.ts";
import type { FileType } from "@replay/electron/data/database";
import jetpack from "fs-jetpack";
import dayjs from "dayjs";
import path from "path";
import { appId } from "@replay/electron/utils/import-before-all-import.ts";
import api from "@replay/shared/clients/api.ts";
import type { SavedSong } from "@replay/electron/data/db-types.ts";
export const fetchRequiredFiles = async () => {
  const { requiredFilesController } = await import("@replay/electron/clients/required-files-downloader.ts");
  return requiredFilesController.listAndDownloadModels();
};

export const fetchServer = async () => {
  const { pythonService } = await import("@replay/electron/clients/pythonService.ts");
  return pythonService.downloadLatestServer();
};
export const startServer = async () => {
  const { pythonService } = await import("@replay/electron/clients/pythonService.ts");
  return pythonService.startServer();
};

export const fetchServerDownloadStatus = async () => {
  const { pythonService } = await import("@replay/electron/clients/pythonService.ts");
  return {
    progress: pythonService.progress,
    error: pythonService.error,
    isDownloading: pythonService.isDownloading,
    downloadStatus: pythonService.downloadStatus,
    currentFileNum: pythonService.currentFileNum,
    fileCount: pythonService.fileCount,
    totalSizeDownloaded: pythonService.totalSizeDownloaded,
    totalSize: pythonService.totalSize,
  };
};

export const fetchRequiredFilesDownloadStatus = async () => {
  const { requiredFilesController } = await import("@replay/electron/clients/required-files-downloader.ts");
  return {
    progress: requiredFilesController.progress,
    error: requiredFilesController.error,
    isDownloading: requiredFilesController.isDownloading,
    currentFileNum: requiredFilesController.currentFileNum,
    fileCount: requiredFilesController.fileCount,
    totalSizeDownloaded: requiredFilesController.totalSizeDownloaded,
    totalSize: requiredFilesController.totalSize,
  };
};

export const uploadSong = async (request: { signedUrl: string; song: SavedSong }) => {
  const { UploadSong } = await import("@replay/electron/clients/songUpload");
  return UploadSong.upload(request.signedUrl, request.song);
};
export const getSongUploadStatus = async (songId: string) => {
  const { UploadSong } = await import("@replay/electron/clients/songUpload");
  return {
    progress: UploadSong.progress[songId],
    error: UploadSong.error[songId],
  };
};
export const fetchModels = async () => {
  const { WeightDownloader } = await import("@replay/electron/clients/modelWeights.ts");
  return WeightDownloader.getWeightOptions();
};
export const fetchLocalModels = async () => {
  const { WeightDownloader } = await import("@replay/electron/clients/modelWeights.ts");
  return WeightDownloader.getWeightOptions(true);
};
export const fetchModelDownloadStatus = async (model: ArtistModelOption | null | undefined) => {
  if (!model) {
    return { progress: null, error: null };
  }
  const { WeightDownloader } = await import("@replay/electron/clients/modelWeights.ts");
  return {
    progress: WeightDownloader.progress[model.id],
    error: WeightDownloader.error[model.id],
  };
};

export const fetchStemModelDownloadStatus = async (model: string) => {
  if (!model) {
    return { progress: null, error: null };
  }
  const { requiredFilesController } = await import("@replay/electron/clients/required-files-downloader.ts");
  return {
    progress: requiredFilesController.stemProgress[model],
    error: requiredFilesController.stemError[model],
    fileCounts: requiredFilesController.numFilesDownloading[model],
  };
};
export const downloadSpecificModel = async (model: ArtistModelOption) => {
  const { WeightDownloader } = await import("@replay/electron/clients/modelWeights.ts");
  return WeightDownloader.download(model);
};

export const downloadStemModel = async (model: string) => {
  const { requiredFilesController } = await import("@replay/electron/clients/required-files-downloader.ts");
  const resp = await api.stemmingModels();
  const models = resp.data.models;
  const modelInfo = models.find((m) => m.name === model);
  if (!modelInfo) {
    throw new Error(`Model ${model} not found`);
  }
  return requiredFilesController.downloadStemModel(modelInfo);
};

export const listStemModels = async () => {
  const { requiredFilesController } = await import("@replay/electron/clients/required-files-downloader.ts");
  return requiredFilesController.listStemModels();
};
export const hasRequiredFiles = async (fast?: boolean) => {
  const { hasRequiredFiles } = await import("@replay/electron/data/file-utils");
  return hasRequiredFiles(fast);
};
export const selectNewLocalDataDir = async () => {
  const { dialog } = await import("electron");
  const { localAppDir, getLocalDataDir, setNewAppDataDir } = await import(
    "@replay/electron/utils/import-before-all-import"
  );
  const { db } = await import("@replay/electron/data/database");

  const dirSelection = await dialog.showOpenDialog({
    title: "Select new data directory",
    properties: ["openDirectory"],
  });
  if (dirSelection.canceled) {
    return;
  }
  let newDir = dirSelection.filePaths[0];
  const basename = path.basename(newDir);
  if (basename === appId) {
    newDir = path.dirname(newDir);
  }
  // create dir
  await jetpack.dirAsync(newDir);
  // save db contents

  await db.moveDirectory(localAppDir, getLocalDataDir(newDir));
  // move files
  const newAppDir = getLocalDataDir(newDir);
  // if newAppDir exists and has a db file, lets actually just not move anything and use that
  const existsAlready = await jetpack.existsAsync(newAppDir);
  if (!existsAlready) {
    await jetpack.moveAsync(localAppDir, newAppDir, { overwrite: true });
  }
  setNewAppDataDir(newDir);
  return;
};

export const getCurrentAppDir = async () => {
  const { localAppDir } = await import("@replay/electron/utils/import-before-all-import");
  return localAppDir;
};

export const openSettingsPage = async () => {
  const { showSettings } = await import("@replay/electron/utils/util");
  await showSettings();
  return;
};

export const serverProcessStatus = async () => {
  const { pythonService } = await import("@replay/electron/clients/pythonService");
  return pythonService.statusMessage;
};
export const serverLogs = async () => {
  const { pythonService } = await import("@replay/electron/clients/pythonService");

  return pythonService.logs();
};

export const addLocalModel = async (path: string) => {
  const { WeightDownloader } = await import("@replay/electron/clients/modelWeights.ts");
  return WeightDownloader.addLocalModel(path);
};
export const removeLocalModel = async (path: string) => {
  const { WeightDownloader } = await import("@replay/electron/clients/modelWeights.ts");
  return WeightDownloader.removeModelByName(path);
};

export const showModelInFinder = async (path: string) => {
  const { WeightDownloader } = await import("@replay/electron/clients/modelWeights.ts");
  return WeightDownloader.showModelInFinderByName(path);
};
export const saveAudioFileForProcessing = async (blob: { buffer: Uint8Array; type: string }) => {
  const { saveAudioFileForProcessing } = await import("@replay/electron/data/file-utils");

  return saveAudioFileForProcessing(blob);
};

export const getAnalyticsDisabled = async () => {
  const { db } = await import("@replay/electron/data/database");
  return db.getAnalyticsDisabled();
};

export const setAnalyticsDisabled = async (analyticsDisabled: boolean) => {
  const { db } = await import("@replay/electron/data/database");
  return db.setAnalyticsDisabled(analyticsDisabled);
};

export const getDeviceId = async () => {
  const { db } = await import("@replay/electron/data/database");
  return db.getDeviceId();
};

export const getSong = async (songId: string) => {
  const { db } = await import("@replay/electron/data/database");
  return db.getSong(songId);
};
export const createdSongList = async () => {
  const { db } = await import("@replay/electron/data/database");
  return db.getSavedSongs();
};
export const configShouldUsePinnedVersion = async () => {
  const { db } = await import("@replay/electron/data/database");
  return db.configShouldUsePinnedVersion();
};
export const setConfigShouldUsePinnedVersion = async (newVal: boolean) => {
  const { db } = await import("@replay/electron/data/database");
  await db.setConfigShouldUsePinnedVersion(newVal);
  const { app } = await import("electron");
  app.relaunch();
};

export const getDownloadDirectory = async () => {
  const { db } = await import("@replay/electron/data/database");
  const dbDirectory = await db.getDownloadDirectory();
  if (!dbDirectory) {
    const { app } = await import("electron");
    return app.getPath("downloads");
  } else {
    return dbDirectory;
  }
};

export const setDownloadDirectory = async () => {
  const { db } = await import("@replay/electron/data/database");
  const { dialog } = await import("electron");
  console.log("Opening download directory");
  const dirSelection = await dialog.showOpenDialog({
    title: "Select new download directory",
    properties: ["openDirectory"],
  });
  if (dirSelection.canceled) {
    return;
  }
  const newDir = dirSelection.filePaths[0];
  return db.setDownloadDirectory(newDir);
};

export const hasCompletedOnboarding = async () => {
  const { db } = await import("@replay/electron/data/database");
  return db.hasCompletedOnboarding();
};

export const setHasCompletedOnboarding = async (hasCompleted: boolean) => {
  const { db } = await import("@replay/electron/data/database");
  return db.setHasCompletedOnboarding(hasCompleted);
};

export const setHuggingFaceToken = async (token: string | null) => {
  const { db } = await import("@replay/electron/data/database");
  const { WeightDownloader } = await import("@replay/electron/clients/modelWeights.ts");

  await db.setHuggingFaceToken(token);
  await WeightDownloader.getRemoteWeightOptions(true);
};

export const getHuggingFaceToken = async () => {
  const { db } = await import("@replay/electron/data/database");
  return db.getHuggingFaceToken() || null;
};

export const getFavorites = async (): Promise<string[]> => {
  const { db } = await import("@replay/electron/data/database");
  return db.getFavorites() || [];
};

export const addFavorite = async (modelId: string) => {
  const { db } = await import("@replay/electron/data/database");
  return db.addFavorite(modelId);
};

export const removeFavorite = async (modelId: string) => {
  const { db } = await import("@replay/electron/data/database");
  return db.removeFavorite(modelId);
};
export const saveCompletedSong = async (jobId: string) => {
  const { db } = await import("@replay/electron/data/database");
  const { api } = await import("@replay/shared/clients/api");
  if (!jobId) {
    return null;
  }
  const resp = await api.songProgress(null, { jobId });
  const data = resp.data;
  const {
    outputFilepath,
    trackName,
    options,
    inputFilepath,
    status,
    convertedVocalsPath,
    originalVocalsPath,
    instrumentalsPath,
    songHash,
    preDeechoVocalsFile,
  } = data;
  if (status === "completed") {
    const existingSavedSong = db.getSavedSongByJob(jobId);
    if (existingSavedSong) {
      existingSavedSong.status = "completed";
      if (outputFilepath) {
        existingSavedSong.songPath = outputFilepath;
      }
      if (originalVocalsPath) {
        existingSavedSong.originalVocalsPath = originalVocalsPath;
      }
      if (convertedVocalsPath) {
        existingSavedSong.convertedVocalsPath = convertedVocalsPath;
      }
      if (inputFilepath) {
        existingSavedSong.originalFilePath = inputFilepath;
      }
      if (instrumentalsPath) {
        existingSavedSong.instrumentalsPath = instrumentalsPath;
      }
      if (trackName) {
        existingSavedSong.parsedTrackName = trackName;
      }
      if (preDeechoVocalsFile) {
        existingSavedSong.preDeechoVocalsFile = preDeechoVocalsFile;
      }
      if (options) {
        existingSavedSong.options = options;
      }
      if (songHash) {
        existingSavedSong.songHash = songHash;
      }
      if (!existingSavedSong.dateCompleted) {
        existingSavedSong.dateCompleted = new Date().getTime();
      }
      await db.updateSong(existingSavedSong);
      await api.clearJob(null, { jobId });
      return true;
    }
    return false;
  } else if (status === "errored" || status === "stopped") {
    console.error("Song errored or stopped", data);
  } else {
    console.log("Song not completed yet", data);
  }
  return false;
};
export const deleteSongByid = async (id: string) => {
  const { db } = await import("@replay/electron/data/database");
  const song = db.getSavedSongByJob(id);
  await db.deleteSongById(id);
  if (song) {
    await jetpack.removeAsync(song.songPath);
  }
};

const getFilePathForType = (song: SavedSong, type: FileType) => {
  const { originalVocalsPath, originalFilePath, convertedVocalsPath, instrumentalsPath, songPath } = song;
  switch (type) {
    case "original_vocals":
      return originalVocalsPath;
    case "converted_vocals":
      return convertedVocalsPath;
    case "instrumentals":
      return instrumentalsPath;
    case "original_song":
      return originalFilePath;
    case "song":
      return songPath;
    default:
      return null;
  }
};

const getFileNameForType = (song: SavedSong, type: FileType, ext: string) => {
  const dateStr = dayjs(song.dateCompleted || song.dateStarted).format("YYYYMMDD");
  const name = song.displayName || song.parsedTrackName || song.id;
  const model = song.modelName || song.modelId;
  const fileName = `${model} sings ${name}-${dateStr}${ext}`;

  switch (type) {
    case "original_song":
      return "(original-audio) " + fileName;
    case "original_vocals":
      return "(original-vocals) " + fileName;
    case "converted_vocals":
      return "(converted-vocals) " + fileName;
    case "instrumentals":
      return "(instrumentals) " + fileName;
    case "song":
      return fileName;
    default:
      return null;
  }
};

export const copyFileToDownloads = async (song: SavedSong, type: FileType) => {
  const filePath = getFilePathForType(song, type);
  if (!filePath) {
    throw new Error(`No file path for type: ${type || "song"}`);
  }
  const path = await import("path");
  const ext = path.extname(filePath);
  const fileName = getFileNameForType(song, type, ext);
  if (!fileName) {
    throw new Error(`Could not create filepath for type: ${type || "song"}`);
  }
  const { app, shell } = await import("electron");
  const { db } = await import("@replay/electron/data/database");
  const customDownloadDir = await db.getDownloadDirectory();
  const downloadDir = customDownloadDir || app.getPath("downloads");

  const destination = path.join(downloadDir, fileName);
  await jetpack.copyAsync(filePath, destination, { overwrite: true });
  shell.showItemInFolder(destination);
};

export const updateSongName = async (name: string, id: string) => {
  const { db } = await import("@replay/electron/data/database");
  await db.setDisplayName(name, id);
};

export const updateSongShareId = async (shareId: string, songId: string) => {
  const { db } = await import("@replay/electron/data/database");
  await db.setShareId(shareId, songId);
};
