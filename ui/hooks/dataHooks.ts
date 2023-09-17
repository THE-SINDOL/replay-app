import { trpcReact } from "../config/trpc";
import { useQuery } from "@tanstack/react-query";
import path from "path-browserify";
import { useReplay } from "../context.tsx";
import { useMemo } from "react";
import type { ArtistModelOption } from "@replay/electron/clients/modelWeights.ts";

export const useHasRequiredLocalFiles = () => {
  return trpcReact.hasRequiredFiles.useQuery(true, { refetchInterval: (data) => (data ? false : 1500) });
};
export const useHasRequiredFileComprehensive = () => {
  return trpcReact.hasRequiredFiles.useQuery(false, {
    refetchInterval: (data) => (data ? false : 1500),
  });
};

export const useFetchingLocalFilesDownloadStatus = () => {
  return trpcReact.fetchLocalModelStatus.useQuery(undefined, { refetchInterval: 500 });
};
export const useModelDownloadStatus = (model: ArtistModelOption | undefined) => {
  const isDownloaded = Boolean(model?.downloaded);

  return trpcReact.fetchModelDownloadStatus.useQuery(model, {
    enabled: !isDownloaded,
    refetchInterval: isDownloaded ? false : 1000,
  });
};

export const useFetchingServerStatus = () => {
  return trpcReact.fetchServerDownloadStatus.useQuery(undefined, { refetchInterval: 500 });
};
export const useModelList = () => {
  const allModels = trpcReact.fetchModels.useQuery(undefined, { placeholderData: [] });
  const localModels = trpcReact.fetchLocalModels.useQuery(undefined, { placeholderData: [] });
  if (allModels.data?.length) {
    return allModels;
  }
  return localModels;
};

const useModelIdMap = () => {
  const { data: models } = useModelList();
  return useMemo(() => {
    const modelIdMap = {};
    for (const model of models || []) {
      modelIdMap[model.id] = model;
    }
    return modelIdMap;
  }, [models]);
};
export const useSelectedModel = () => {
  const modelId = useReplay((state) => state.modelId);
  const modelMap = useModelIdMap();
  const model = modelId ? modelMap[modelId] : undefined;
  return model;
};

export const useIsServerRunning = () => {
  const { data: isServerRunning } = trpcReact.serverIsRunning.useQuery(undefined, {
    refetchInterval: (data) => (data ? 5000 : 500),
    placeholderData: false,
    initialData: false,
  });
  return isServerRunning;
};

export const useDevice = () => {
  const isServerRunning = useIsServerRunning();
  return trpcReact.torchDevice.useQuery(undefined, { enabled: Boolean(isServerRunning) });
};

export const useHasDownloadedSelectedStemModel = (modelOverride?: string) => {
  const downloadedModels = useHasDownloadedSelectedStemModelsList();
  const options = useReplay((state) => state.options);

  const stemMethod = modelOverride || options.stemmingMethod;
  return Boolean(downloadedModels.find((model) => model.name === stemMethod));
};

export const useStemModelList = () => {
  const isServerRunning = useIsServerRunning();
  return trpcReact.fetchStemmingModels.useQuery(undefined, {
    placeholderData: [],
    refetchInterval: (d) => (d ? false : 1000),
    enabled: Boolean(isServerRunning),
  });
};
export const useHasDownloadedSelectedStemModelsList = () => {
  const isServerRunning = useIsServerRunning();
  const { data: modelsDownloaded = [] } = trpcReact.listDownloadedStemModels.useQuery(undefined, {
    placeholderData: [],
  });
  const { data: stemmingModels = [] } = trpcReact.fetchStemmingModels.useQuery(undefined, {
    enabled: Boolean(isServerRunning),
    placeholderData: [],
  });
  return useMemo(
    () =>
      stemmingModels.filter((model) => {
        const files = model.files;
        return files.every((filename) => modelsDownloaded.includes(filename || ""));
      }),
    [modelsDownloaded, stemmingModels],
  );
};
export const useModelNameFromId = (id: string | undefined | null) => {
  const { data: models } = useModelList();
  const { data } = useQuery(["modelName", models?.length, id], () => {
    const model = models?.find((a) => a.id === id);
    return model?.name || id;
  });
  return data || "";
};
const EMPTY_OBJ = {};
export const useModelNameMap = () => {
  const { data: models } = useModelList();
  const { data } = useQuery(["modelNameMap", models?.length], () => {
    return (models || []).reduce((acc, model) => {
      acc[model.id] = model.name;
      acc[path.parse(model.id).name] = model.name;
      return acc;
    }, {});
  });
  return data || EMPTY_OBJ;
};

export const useIsModelIdFavorite = (modelId: string | undefined | null) => {
  const { data: favorites } = useFavorites();
  if (!modelId) {
    return false;
  }
  return (favorites || []).some((l) => l === modelId || path.parse(l).name === path.parse(modelId).name);
};
export const useJobs = () => {
  const isServerRunning = useIsServerRunning();
  return trpcReact.runningJobs.useQuery(undefined, {
    placeholderData: [],
    refetchInterval: 1000,
    enabled: Boolean(isServerRunning),
  });
};
export const useFavorites = () => {
  return trpcReact.getFavorites.useQuery(undefined, { placeholderData: [] });
};

export const useJobStatus = (jobId: string) => {
  const { data: jobs } = useJobs();
  const job = jobs?.find((j) => j.jobId === jobId);
  return job;
};
