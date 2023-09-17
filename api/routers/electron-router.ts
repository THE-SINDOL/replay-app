import { z } from "zod";
import { t } from "../trpc";
import {
  addFavorite,
  addLocalModel,
  configShouldUsePinnedVersion,
  copyFileToDownloads,
  createdSongList,
  deleteSongByid,
  downloadSpecificModel,
  downloadStemModel,
  fetchModelDownloadStatus,
  fetchRequiredFiles,
  fetchRequiredFilesDownloadStatus,
  fetchServer,
  fetchServerDownloadStatus,
  fetchStemModelDownloadStatus,
  getAnalyticsDisabled,
  getCurrentAppDir,
  getDeviceId,
  getDownloadDirectory,
  getFavorites,
  getHuggingFaceToken,
  getSong,
  getSongUploadStatus,
  hasCompletedOnboarding,
  hasRequiredFiles,
  listStemModels,
  openSettingsPage,
  removeFavorite,
  removeLocalModel,
  saveAudioFileForProcessing,
  saveCompletedSong,
  selectNewLocalDataDir,
  serverLogs,
  serverProcessStatus,
  setAnalyticsDisabled,
  setConfigShouldUsePinnedVersion,
  setDownloadDirectory,
  setHasCompletedOnboarding,
  setHuggingFaceToken,
  showModelInFinder,
  startServer,
  updateSongName,
  updateSongShareId,
  uploadSong,
} from "../electron-client";
import { zodFileType, zodModel, zodSongModel } from "../validation/zod";
import api from "@replay/shared/clients/api.ts";
import path from "path";
import fs from "fs/promises";
const procedure = t.procedure;
const q = procedure.query;
const i = procedure.input;
export const electronRouter = t.router({
  fetchLocalModel: procedure.mutation(fetchRequiredFiles),
  fetchServer: procedure.mutation(fetchServer),
  fetchServerDownloadStatus: q(fetchServerDownloadStatus),
  configShouldUsePinnedVersion: q(configShouldUsePinnedVersion),
  canShowPinnedVersion: q(async () => Boolean(process.env.GITHUB_SHA)),
  fetchLocalModelStatus: q(fetchRequiredFilesDownloadStatus),
  fetchModelDownloadStatus: i(zodModel).query((req) => fetchModelDownloadStatus(req.input)),
  fetchStemModelDownloadStatus: i(zodModel).query((req) => fetchStemModelDownloadStatus(req.input)),
  listDownloadedStemModels: q(listStemModels),
  downloadStemModel: i(zodModel).mutation((req) => downloadStemModel(req.input)),
  openSettingsPage: q(openSettingsPage),
  selectNewAppDir: procedure.mutation(selectNewLocalDataDir),
  startServer: procedure.mutation(startServer),
  getCurrentAppDir: q(getCurrentAppDir),
  downloadSpecificModel: i(zodModel).mutation((req) => downloadSpecificModel(req.input)),
  hasRequiredFiles: i(z.boolean()).query((fast) => hasRequiredFiles(fast.input)),
  getDownloadDirectory: q(getDownloadDirectory),
  setDownloadDirectory: procedure.mutation(setDownloadDirectory),
  hasCompletedOnboarding: q(hasCompletedOnboarding),
  setHasCompletedOnboarding: i(z.boolean()).mutation((req) => setHasCompletedOnboarding(req.input)),
  setConfigShouldUsePinnedVersion: i(z.boolean()).mutation((req) => setConfigShouldUsePinnedVersion(req.input)),
  createdSongList: q(createdSongList),
  getHuggingFaceToken: q(getHuggingFaceToken),
  getFavorites: q(getFavorites),
  getOsDetails: q(async () => {
    const os = await import("os");
    return {
      platform: os.platform(),
      release: os.release(),
      type: os.type(),
      arch: os.arch(),
      cpus: os.cpus(),
      endianness: os.endianness(),
      freemem: os.freemem(),
      totalmem: os.totalmem(),
      homedir: os.homedir(),
      hostname: os.hostname(),
      loadavg: os.loadavg(),
      networkInterfaces: os.networkInterfaces(),
    };
  }),
  getAnalyticsDisabled: q(getAnalyticsDisabled),
  setAnalyticsDisabled: i(z.boolean()).mutation((req) => setAnalyticsDisabled(req.input)),
  getDeviceId: q(getDeviceId),
  getSong: i(z.string()).query((req) => getSong(req.input)),
  getSongUploadStatus: i(z.string()).query((req) => getSongUploadStatus(req.input)),
  loadLocalModel: i(z.string()).mutation((req) => addLocalModel(req.input)),
  removeModel: i(z.string()).mutation((req) => removeLocalModel(req.input)),
  showModelInFinder: i(z.string()).mutation((req) => showModelInFinder(req.input)),
  deleteSong: i(z.string()).mutation((req) => deleteSongByid(req.input)),
  removeFavorite: i(z.string()).mutation((req) => removeFavorite(req.input)),
  addFavorite: i(z.string()).mutation((req) => addFavorite(req.input)),
  setHuggingFaceToken: i(z.string().or(z.null())).mutation((req) => setHuggingFaceToken(req.input)),
  copyFileToDownloads: i(z.object({ song: zodSongModel, type: zodFileType })).mutation((req) =>
    copyFileToDownloads(req.input.song, req.input.type),
  ),
  saveAudioFileForProcessing: procedure
    .input(z.object({ buffer: z.instanceof(Uint8Array), type: z.string() }))
    .mutation((req) => {
      return saveAudioFileForProcessing(req.input);
    }),
  serverProcessStatus: q(serverProcessStatus),
  serverLogs: q(serverLogs),
  saveCompletedSong: i(z.string()).mutation((req) => saveCompletedSong(req.input)),
  updateSongName: i(z.object({ songId: z.string(), name: z.string() })).mutation((req) => {
    return updateSongName(req.input.name, req.input.songId);
  }),
  updateSongShareId: i(z.object({ shareId: z.string(), songId: z.string() })).mutation((req) => {
    return updateSongShareId(req.input.shareId, req.input.songId);
  }),
  uploadSong: i(zodSongModel).mutation((req) => uploadSong(req.input)),
  getPreviewSong: i(z.any()).query(async (req) => {
    const filepath = req.input;
    if (!filepath) {
      return filepath;
    }
    const filename = path.parse(filepath).name;
    const previewFilename = `${filename}_preview.mp3`;
    const previewFilenamePath = path.join(path.dirname(filepath), previewFilename);
    const exists = await fs
      .access(previewFilenamePath)
      .then(() => true)
      .catch(() => false);
    return exists ? previewFilenamePath : filepath;
  }),
  shutdownApiServer: q(async () => {
    return api.shutdown();
  }),
});
