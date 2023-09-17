import React from "react";
import Box from "@mui/material/Box";

import Typography from "@mui/material/Typography";
import { ModelSelectorContainer } from "./ModelSelector/ModelSelectorContainer.tsx";
import { SongSelector } from "./SongSelector";
import Button from "@mui/material/Button";
import { useReplay } from "../../context";
import { trpcReact } from "../../config/trpc";
import theme from "../theme";
import { toast } from "react-toastify";
import { SongSettings } from "../Settings/SongSettings.tsx";
import OnboardingModal from "../Onboarding/OnboardingModal";
import { useAnalytics } from "../../hooks/useAnalytics.ts";
import {
  useDevice,
  useHasDownloadedSelectedStemModel,
  useIsServerRunning,
  useJobs,
  useSelectedModel,
} from "../../hooks/dataHooks.ts";
import DynamicFeedIcon from "@mui/icons-material/DynamicFeed";
const hasSeenCpuWarningKey = "hasSeenCpuWarning";
const SubmitButton = () => {
  const modelId = useReplay((state) => state.modelId);
  const selectedModel = useSelectedModel();
  const options = useReplay((state) => state.options);
  const { data: jobs, refetch: refetchJobs } = useJobs();
  const songUrlOrFilePath = useReplay((state) => state.songUrlOrFilePath);
  const { mutateAsync, error, isLoading } = trpcReact.createSong.useMutation();
  const hasDownloadedStemModel = useHasDownloadedSelectedStemModel();
  const { data: device } = useDevice();
  const logEvent = useAnalytics();

  const isServerRunning = useIsServerRunning();
  const downloaded = selectedModel?.downloaded;
  const batchDisabled =
    !hasDownloadedStemModel ||
    !isServerRunning ||
    isLoading ||
    (!downloaded && !options.vocalsOnly) ||
    (!modelId && !options.vocalsOnly);
  const disabled = batchDisabled || !songUrlOrFilePath;

  const getButtonCopy = () => {
    if (!isServerRunning) {
      return "Server not running";
    }
    if (isLoading) {
      return "Loading...";
    }
    if (!songUrlOrFilePath) {
      return "Select a song";
    }
    if (!modelId && options.vocalsOnly) {
      return "Stem song";
    }
    if (!modelId) {
      return "Select an artist";
    }

    if (!hasDownloadedStemModel) {
      return "Download Stem Model First";
    }

    if (!downloaded) {
      return "Download Selected Model First";
    }

    const queuedJobs = (jobs || []).filter((job) => job.status === "queued");
    if (queuedJobs.length === 0) {
      return "Create Song";
    }
    return `Create Song (${queuedJobs.length} queued)`;
  };
  const checkCpuWarning = () => {
    if (device === "cpu") {
      const hasSeenCpuWarning = localStorage.getItem(hasSeenCpuWarningKey);
      if (!hasSeenCpuWarning) {
        const didConfirm = confirm(
          "Warning - your current device is CPU. Replay works best when running on a GPU with CUDA or with a Macbook Pro M1 with MPS. Running on CPU will take significantly longer, and might use up 100% of CPU while it's running. Are you sure you'd like to continue?",
        );
        if (!didConfirm) {
          toast.info("Canceled run");
          return;
        }
        localStorage.setItem(hasSeenCpuWarningKey, "true");
      }
    }
  };
  const createSongFromPath = async (path: string) => {
    if (path) {
      logEvent({ event: "createSong", metadata: { ...options } });
      const resp = await mutateAsync({ modelId, songUrlOrFilePath: path, options });
      if ("jobId" in resp) {
        console.info(`Created song with job id ${resp.jobId}`);
        toast.info("Song Queued!");
      } else {
        toast.error("Error creating song");
      }
    } else {
      toast.error("Path not set");
    }
  };
  const onClick = async () => {
    if (songUrlOrFilePath) {
      checkCpuWarning();
      await createSongFromPath(songUrlOrFilePath);
      await refetchJobs();
    }
  };

  const onBatchClick = async () => {
    // batch import
    const input = document.createElement("input");
    input.type = "file";
    input.webkitdirectory = true;
    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const files = target!.files;
      if (files) {
        const audioFiles = Array.from(files).filter((f) => f.type.startsWith("audio"));
        for (const file of audioFiles) {
          await createSongFromPath(file.path);
        }
      }
    };
    input.click();
  };
  return (
    <>
      <Box sx={{ display: "flex", width: "100%", flexDirection: "column", gap: 1, mt: 1 }}>
        <SongSettings />
        <Box display={"flex"}>
          <Button
            sx={{ width: "100%", borderRadius: "12px" }}
            disabled={disabled}
            onClick={onClick}
            variant={"contained"}
          >
            {getButtonCopy()}
          </Button>
          <Button
            sx={{ ml: 1, borderRadius: "12px" }}
            onClick={onBatchClick}
            disabled={batchDisabled}
            variant={"outlined"}
            title={"Batch"}
          >
            <DynamicFeedIcon />
          </Button>
        </Box>
      </Box>
      {error && (
        <Typography variant={"body1"} sx={{ color: theme.colors.error }}>
          Error: {error.message}
        </Typography>
      )}
    </>
  );
};

const CreationFlow = () => {
  const { data: hasCompletedOnboarding, refetch } = trpcReact.hasCompletedOnboarding.useQuery(undefined, {
    placeholderData: true,
  });

  return (
    <>
      {!hasCompletedOnboarding && <OnboardingModal refetch={refetch} />}
      <SongSelector />
      <ModelSelectorContainer />
      <SubmitButton />
    </>
  );
};

export const CreateSong = () => {
  return (
    <Box
      sx={{
        zIndex: 999,
        justifyContent: "flex-start",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        background: theme.colors.background,
        overflowY: "auto",
        px: 3,
        py: 2,
        display: "flex",
        alignItems: "center",
        "&::-webkit-scrollbar": {
          width: "0.4em",
          display: "block",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: theme.palette.primary.dark,
          backgroundClip: "padding-box",
          borderRadius: 999,
          opacity: 0.5,
        },
      }}
    >
      <Box
        sx={{
          zIndex: 999,
          background: theme.colors.background,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minWidth: 480,
          maxWidth: 850,
        }}
      >
        <Typography variant={"h1"}>Create New Song</Typography>
        <CreationFlow />
      </Box>
    </Box>
  );
};
