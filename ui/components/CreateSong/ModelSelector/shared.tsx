import type { BoxProps } from "@mui/material/Box";
import Box from "@mui/material/Box";
import theme from "../../theme.ts";
import * as React from "react";
import { sizeFormatter as formatter } from "../../../utils/sizeFormatter.ts";
import type { ArtistModelOption } from "@replay/electron/clients/modelWeights.ts";
import { useModelDownloadStatus } from "../../../hooks/dataHooks.ts";
export const ICON_SIZE = 30;

export const ModelWrapper = ({ children, ...rest }: BoxProps) => {
  return (
    <Box
      {...rest}
      sx={{
        height: 350,
        maxHeight: 350,
        overflowY: "scroll",
        overflowX: "hidden",
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
        backgroundColor: "#3c3c3c",
        p: "8px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        ...(rest.sx || {}),
      }}
    >
      {children}
    </Box>
  );
};
export const ModelDownloadStatusText = ({
  model,
  notDownlodedText,
}: {
  notDownlodedText?: string | null;
  model: ArtistModelOption;
}) => {
  const isDownloaded = Boolean(model?.downloaded);

  const { data: downloadStatus } = useModelDownloadStatus(model);

  if (isDownloaded) {
    return "Downloaded";
  }

  const isDownloading = Boolean(downloadStatus?.progress);
  if (!isDownloading) {
    return notDownlodedText || null;
  }

  const progress = downloadStatus?.progress;
  if (!progress || !progress?.loaded) {
    return "Downloading...";
  }

  const fileByteCount = progress?.total || 1;
  const currentFileDownloadedBytes = progress?.loaded || 0;
  const currFilePercent = Math.round((currentFileDownloadedBytes * 100) / fileByteCount);
  return `${formatter(currentFileDownloadedBytes)} / ${formatter(fileByteCount)} (${currFilePercent}%)`;
};
