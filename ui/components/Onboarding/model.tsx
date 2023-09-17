import { Wrapper } from "./wrapper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import React from "react";
import type { SharedProps } from "./onboarding";
import { LinearProgress } from "@mui/material";
import { sizeFormatter as formatter } from "../../utils/sizeFormatter";
import { trpcReact } from "../../config/trpc";
import {
  useFetchingLocalFilesDownloadStatus,
  useFetchingServerStatus,
  useHasRequiredFileComprehensive,
  useHasRequiredLocalFiles,
} from "../../hooks/dataHooks";
import { ArrowForward, Download } from "@mui/icons-material";

const ServerProgress = () => {
  const { data: serverStatus } = useFetchingServerStatus();
  const { progress, downloadStatus, error } = serverStatus || {};

  const fileByteCount = progress?.total || 1;
  const currentFileDownloadedBytes = progress?.loaded || 0;
  const currFilePercent = Math.round((currentFileDownloadedBytes * 100) / fileByteCount);

  const fileCount = serverStatus?.fileCount || 0;
  const currentFileNum = serverStatus?.currentFileNum;
  const totalSize = serverStatus?.totalSize || 0;
  const totalSizeDownloaded = serverStatus?.totalSizeDownloaded || 0;
  const totalBytesDownloaded = totalSizeDownloaded + currentFileDownloadedBytes;
  const percentCompletedTotal = Math.round((totalBytesDownloaded * 100) / totalSize);

  const downloadProgress = totalBytesDownloaded
    ? `Total: ${formatter(totalBytesDownloaded)} / ${formatter(totalSize)}`
    : "Downloading...";

  const getSuffix = () => {
    if (fileByteCount !== 1 && fileByteCount) {
      return ` - ${formatter(currentFileDownloadedBytes)} / ${formatter(fileByteCount)} (
        ${currFilePercent}%)`;
    }
    return null;
  };
  const suffix = getSuffix();
  return (
    <Box sx={{ width: 400 }}>
      {downloadStatus && (
        <Typography variant={"body1"} sx={{ py: 1, display: "flex", justifyContent: "center" }}>
          {downloadStatus}
        </Typography>
      )}
      {fileCount > 0 && (
        <Typography variant={"body1"} sx={{ py: 1, display: "flex", justifyContent: "center" }}>
          File {currentFileNum} of {fileCount}
          {suffix}
        </Typography>
      )}
      {error && (
        <Typography variant={"body1"} sx={{ py: 1, display: "flex", justifyContent: "center" }}>
          Error: {`${error}`}
        </Typography>
      )}
      {percentCompletedTotal > 0 && (
        <>
          <LinearProgress variant={"determinate"} value={percentCompletedTotal} />
          <Typography variant={"body1"} sx={{ py: 1, display: "flex", justifyContent: "center" }}>
            {percentCompletedTotal}%
          </Typography>
          <Typography variant={"body1"} sx={{ py: 1, display: "flex", justifyContent: "center" }}>
            {downloadProgress}
          </Typography>
        </>
      )}
    </Box>
  );
};

const Progress = () => {
  const { data: localModelStatus } = useFetchingLocalFilesDownloadStatus();
  const modelProgress = localModelStatus?.progress;

  if (!localModelStatus || !localModelStatus.fileCount) {
    return null;
  }

  const fileByteCount = modelProgress?.total || 1;
  const currentFileDownloadedBytes = modelProgress?.loaded || 0;
  const currFilePercent = Math.round((currentFileDownloadedBytes * 100) / fileByteCount);

  const fileCount = localModelStatus.fileCount;
  const currentFileNum = localModelStatus.currentFileNum;
  const totalSize = localModelStatus.totalSize;
  const totalSizeDownloaded = localModelStatus.totalSizeDownloaded;
  const totalBytesDownloaded = totalSizeDownloaded + currentFileDownloadedBytes;
  const percentCompletedTotal = Math.round((totalBytesDownloaded * 100) / totalSize);

  const downloadProgress = totalBytesDownloaded
    ? `Total: ${formatter(totalBytesDownloaded)} / ${formatter(totalSize)}`
    : "Downloading...";

  const getSuffix = () => {
    if (fileByteCount !== 1 && fileByteCount) {
      return ` - ${formatter(currentFileDownloadedBytes)} / ${formatter(fileByteCount)} (
        ${currFilePercent}%)`;
    }
    return null;
  };
  return (
    <Box sx={{ width: 400 }}>
      <Typography variant={"body1"} sx={{ py: 1, display: "flex", justifyContent: "center" }}>
        File {currentFileNum} of {fileCount}
        {getSuffix()}
      </Typography>
      <LinearProgress variant={"determinate"} value={percentCompletedTotal} />
      <Typography variant={"body1"} sx={{ py: 1, display: "flex", justifyContent: "center" }}>
        {percentCompletedTotal}%
      </Typography>
      <Typography variant={"body1"} sx={{ py: 1, display: "flex", justifyContent: "center" }}>
        {downloadProgress}
      </Typography>
    </Box>
  );
};

export const FetchServerAndModelData = (props: SharedProps) => {
  const { mutateAsync: fetchLocalModel } = trpcReact.fetchLocalModel.useMutation();
  const { mutateAsync: fetchServer, isLoading } = trpcReact.fetchServer.useMutation();
  const { data: serverStatus } = useFetchingServerStatus();

  const { data: hasRequiredFilesFast, refetch: refetchHasRequiredFiles } = useHasRequiredLocalFiles();
  const { data: hasLocalModelDefinitive } = useHasRequiredFileComprehensive();
  const { data: localModelStatus } = useFetchingLocalFilesDownloadStatus();
  const { data: hasCompletedOnboarding } = trpcReact.hasCompletedOnboarding.useQuery(undefined);
  const hasRequiredFiles = hasRequiredFilesFast && hasLocalModelDefinitive;
  const onSubmit = async () => {
    await fetchServer();
    const hasFilesNow = await refetchHasRequiredFiles();
    if (!hasFilesNow.data) {
      await fetchLocalModel();
    }
    await refetchHasRequiredFiles();
  };

  const isFetching = localModelStatus?.isDownloading || serverStatus?.isDownloading;

  return (
    <Wrapper>
      <Typography variant={"h1"}>{hasCompletedOnboarding ? "AI Server Update" : "AI Data Download"}</Typography>
      {hasCompletedOnboarding && (
        <Typography variant={"body1"} sx={{ pb: 1, textAlign: "center" }}>
          There is an update to the server. If you do not wish to receive these updates, you can open up Settings and
          use the pinned version.
        </Typography>
      )}
      <Typography variant={"body1"} sx={{ pb: 1, textAlign: "center" }}>
        Replay needs to download an AI model to generate music. Depending on your internet connection, this might take a
        while.
      </Typography>
      <ServerProgress />
      <Progress />
      <Box>
        <Button
          disabled={isFetching}
          onClick={onSubmit}
          variant={hasRequiredFiles ? "outlined" : "contained"}
          sx={{ borderRadius: 2 }}
          endIcon={<Download />}
        >
          {hasRequiredFiles ? "Re-download" : "Download"}
        </Button>
        <Button
          sx={{ mx: 2, borderRadius: 2 }}
          disabled={isFetching || !hasRequiredFiles}
          onClick={props.onNext}
          variant={"contained"}
          endIcon={<ArrowForward />}
        >
          Continue
        </Button>
      </Box>
    </Wrapper>
  );
};
