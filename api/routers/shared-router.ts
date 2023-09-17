import { t } from "../trpc";
import api from "@replay/shared/clients/api";
import { fetchLocalModels, fetchModels } from "../electron-client";
import { localModelPath, localOutputsPath, localWeightsPath } from "@replay/electron/utils/constants";
import { db } from "@replay/electron/data/database";
import { v4 as uuid } from "uuid";
import { z } from "zod";
import { WeightDownloader } from "@replay/electron/clients/modelWeights.ts";
import { app } from "electron";
import type { SavedSong } from "@replay/electron/data/db-types.ts";
const youtubeRegex =
  /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube(-nocookie)?\.com|youtu.be))(\/(?:[\w-]+\?v=|embed\/|live\/|v\/)?)([\w-]+)(\S+)?$/;
export const sharedRouter = t.router({
  fetchModels: t.procedure.query(fetchModels),
  fetchStemmingModels: t.procedure.query(async () => {
    try {
      const resp = await api.stemmingModels();
      return resp.data.models;
    } catch (e) {
      return [];
    }
  }),
  fetchLocalModels: t.procedure.query(fetchLocalModels),
  serverIsRunning: t.procedure.query(async () => {
    try {
      const resp = await api.health();
      return Boolean(resp.data?.ok);
    } catch (e) {
      return false;
    }
  }),
  runningJobs: t.procedure.query(async () => {
    const resp = await api.jobs();
    return resp.data.jobs;
  }),
  appVersion: t.procedure.query(async () => {
    return app.getVersion();
  }),
  torchDevice: t.procedure.query(async () => {
    try {
      const resp = await api.torchDevice();
      return resp.data.device;
    } catch (e) {
      return "unknown";
    }
  }),
  devices: t.procedure.query(async (): Promise<string[]> => {
    try {
      const resp = await api.deviceOptions();
      return resp.data.devices || [];
    } catch (e) {
      return [];
    }
  }),
  clearJob: t.procedure.input(z.string()).mutation(async (req) => {
    try {
      const resp = await api.clearJob(null, { jobId: req.input });

      return resp.data;
    } catch (e) {
      console.log("Error clearing job", e);
    }
  }),
  stopJob: t.procedure.input(z.string()).mutation(async (req) => {
    try {
      const resp = await api.stopJob(null, { jobId: req.input });
      return resp.data;
    } catch (e) {
      console.log("Error stopping job", e);
      throw e;
    }
  }),
  setDevice: t.procedure.input(z.string()).mutation(async (req) => {
    try {
      const resp = await api.setDevice(null, { device: req.input });
      return resp.data;
    } catch (e) {
      console.log("Error setting device", e);
    }
  }),
  createSong: t.procedure
    .input(z.object({ modelId: z.string().or(z.null()), songUrlOrFilePath: z.string(), options: z.any() }))
    .mutation(async (req) => {
      const { input } = req;
      const { songUrlOrFilePath, modelId, options } = input;
      const resp = await api.createSong(null, {
        songUrlOrFilePath,
        modelId,
        options,
        modelPath: localModelPath,
        outputDirectory: localOutputsPath,
        weightsPath: localWeightsPath,
      });
      const jobId = resp.data.jobId;
      const existingSavedSong = db.getSavedSongByJob(jobId);
      if (!existingSavedSong) {
        const youtubeUrl = youtubeRegex.test(songUrlOrFilePath) ? songUrlOrFilePath : undefined;
        const newSong: SavedSong = {
          jobId,
          originalFilePath: songUrlOrFilePath,
          // save it twice because the one above might get overwritten in the completion handler
          originalRawInput: songUrlOrFilePath,
          dateStarted: new Date().getTime(),
          status: "processing",
          modelId: modelId || "",
          modelName: WeightDownloader.getModelNameFromId(modelId) || modelId || "",
          modelPath: localModelPath,
          outputDirectory: localOutputsPath,
          weightsPath: localWeightsPath,
          id: uuid(),
          options,
          youtubeUrl,
        };
        await db.saveNewSong(newSong);
      }
      return resp.data;
    }),
});
