import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { localDbPath } from "../utils/constants";
import jetpack from "fs-jetpack";
import { v4 as uuid } from "uuid";
import { machineId } from "node-machine-id";
import logger from "@replay/shared/logger.ts";
import type { SavedSong } from "./db-types.ts";

export type FileType =
  | "song"
  | "instrumentals"
  | "original_vocals"
  | "pre_deecho_original_vocals"
  | "converted_vocals"
  | "original_song";

type JobId = string;
export interface SimpleDbSchema {
  analyticsDisabled?: boolean;
  deviceId: string;
  downloadDirectory?: string;
  favorite_models: string[];
  hasCompletedOnboarding: boolean;
  huggingFaceToken?: string | undefined | null;
  songs: Record<JobId, SavedSong>;
  useServerVersionPinnedToUiVersion?: boolean;
}
const DEFAULT_FAVORITES = [
  "kanye",
  "drake",
  "kendrick",
  "justin_bieber",
  "juice_wrld",
  "freddie_mercury",
  "frank_sinatra",
  "ed_sheeran",
];
class SimpleDb {
  private low: Low<SimpleDbSchema>;
  constructor() {
    // Configure lowdb to write data to JSON file
    const adapter = new JSONFile<SimpleDbSchema>(localDbPath);
    const defaultData = {
      analyticsDisabled: false,
      deviceId: "",
      songs: {},
      favorite_models: DEFAULT_FAVORITES,
      hasCompletedOnboarding: false,
      useServerVersionPinnedToUiVersion: true,
    } as SimpleDbSchema;
    this.low = new Low<SimpleDbSchema>(adapter, defaultData);
  }

  init = async () => {
    await this.low.read();
    const deviceId = await machineId();
    this.low.data.deviceId = deviceId || uuid();
    this.low.data.songs = this.low.data.songs || {};
    this.low.data.favorite_models = this.low.data.favorite_models || DEFAULT_FAVORITES;
    this.low.data.hasCompletedOnboarding = this.low.data.hasCompletedOnboarding || false;
    this.low.data.downloadDirectory = this.low.data.downloadDirectory || "";
    this.low.data.analyticsDisabled = this.low.data.analyticsDisabled || false;
    await this.verifySongs();
  };

  getAnalyticsDisabled = (): boolean => {
    return this.low.data.analyticsDisabled || false;
  };

  setAnalyticsDisabled = async (analyticsDisabled: boolean) => {
    this.low.data.analyticsDisabled = analyticsDisabled;
    await this.low.write();
  };

  getDownloadDirectory = (): string | undefined => {
    return this.low.data.downloadDirectory;
  };

  setDownloadDirectory = async (directory: string) => {
    this.low.data.downloadDirectory = directory;
    await this.low.write();
  };

  hasCompletedOnboarding = (): boolean => {
    return this.low.data.hasCompletedOnboarding;
  };

  configShouldUsePinnedVersion = (): boolean => {
    return Boolean(this.low.data.useServerVersionPinnedToUiVersion);
  };

  setConfigShouldUsePinnedVersion = async (useServerVersionPinnedToUiVersion: boolean) => {
    this.low.data.useServerVersionPinnedToUiVersion = useServerVersionPinnedToUiVersion;
    await this.low.write();
  };

  setHasCompletedOnboarding = async (hasCompletedOnboarding: boolean) => {
    this.low.data.hasCompletedOnboarding = hasCompletedOnboarding;
    await this.low.write();
  };

  getDeviceId = (): string => {
    return this.low.data.deviceId;
  };

  getSong = (songId: string): SavedSong => {
    return this.low.data.songs[songId];
  };

  getSavedSongs = (): SavedSong[] => {
    const savedSongs = Object.values(this.low.data.songs).filter((l) => !l.invalid);
    return savedSongs.sort((a, b) => b.dateStarted - a.dateStarted);
  };

  verifySongs = async () => {
    for (const song of Object.values(this.low.data.songs)) {
      const filePath = song.songPath;
      if (!filePath) {
        this.low.data.songs[song.id].invalid = true;
      } else {
        const exists = await jetpack.existsAsync(filePath);
        if (!exists) {
          this.low.data.songs[song.id].invalid = true;
        }
      }
    }
    await this.low.write();
  };

  getSavedSongByJob = (jobId: string): SavedSong | undefined => {
    return Object.values(this.low.data.songs).find((l) => l.jobId === jobId);
  };

  saveNewSong = async (song: SavedSong) => {
    logger.info("Saving new song in DB", song);
    this.low.data.songs[song.id] = song;
    await this.low.write();
  };

  setDisplayName = async (name: string, id: string) => {
    const oldSong = this.low.data.songs[id];
    const updatedSong = { ...(oldSong || {}), displayName: name };
    this.low.data.songs[updatedSong.id] = updatedSong;
    await this.low.write();
  };

  setShareId = async (shareId: string, songId: string) => {
    const oldSong = this.low.data.songs[songId];
    const updatedSong = { ...(oldSong || {}), shareId };
    this.low.data.songs[updatedSong.id] = updatedSong;
    await this.low.write();
  };

  deleteSongById = async (id: string) => {
    delete this.low.data.songs[id];
    await this.low.write();
  };

  addFavorite = async (modelId: string) => {
    this.low.data.favorite_models.unshift(modelId);
    await this.low.write();
  };

  removeFavorite = async (modelId: string) => {
    this.low.data.favorite_models = this.low.data.favorite_models.filter((l) => l !== modelId);
    await this.low.write();
  };

  getFavorites = () => {
    return this.low.data.favorite_models || [];
  };
  updateSong = async (newSong: SavedSong) => {
    const oldSong = this.low.data.songs[newSong.id] || this.getSavedSongByJob(newSong.jobId);
    const updatedSong = { ...(oldSong || {}), ...newSong };
    this.low.data.songs[updatedSong.id] = updatedSong;
    await this.low.write();
  };

  getHuggingFaceToken = () => {
    return this.low.data.huggingFaceToken;
  };
  setHuggingFaceToken = async (token: string | null) => {
    this.low.data.huggingFaceToken = token;
    await this.low.write();
  };

  moveDirectory = async (oldPath: string, newPath: string) => {
    const savedSongs = Object.values(this.low.data.songs);
    for (const song of savedSongs) {
      song.songPath = song.songPath?.replace(oldPath, newPath);
      song.convertedVocalsPath = song.convertedVocalsPath?.replace(oldPath, newPath);
      song.originalFilePath = song.originalFilePath?.replace(oldPath, newPath);
      song.instrumentalsPath = song.instrumentalsPath?.replace(oldPath, newPath);
    }
    await this.low.write();
  };
}

export const db = new SimpleDb();
