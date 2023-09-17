import {
  useFavorites,
  useIsModelIdFavorite,
  useModelDownloadStatus,
  useModelList,
  useSelectedModel,
} from "../../../hooks/dataHooks.ts";
import { trpcReact } from "../../../config/trpc.ts";
import { Close, Download, StarBorder, StarOutlined } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { startCase } from "lodash-es";
import { sizeFormatter as formatter } from "../../../utils/sizeFormatter.ts";
import * as React from "react";
import { ICON_SIZE, ModelDownloadStatusText } from "./shared.tsx";
import CircularProgress from "@mui/material/CircularProgress";
import { useAnalytics } from "../../../hooks/useAnalytics.ts";
import { toast } from "react-toastify";
import theme from "../../theme.ts";
import type { ArtistModelOption } from "@replay/electron/clients/modelWeights.ts";
import { ModelContextMenu } from "./Model.tsx";
import { useContextMenu } from "react-contexify";

const ArtistInfo = ({ title, value }: { title: string; value: string | number }) => {
  const output = Array.isArray(value) ? value.join(", ") : value;
  return (
    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Typography variant={"body2"}>{title}</Typography>
      <Typography variant={"body2"} sx={{ color: "#b1b1b1" }}>
        {output}
      </Typography>
    </Box>
  );
};

const FavoriteIcon = ({ model }: { model: ArtistModelOption }) => {
  const { refetch } = useFavorites();
  const { mutateAsync: removeFavorite } = trpcReact.removeFavorite.useMutation();
  const { mutateAsync: addFavorite } = trpcReact.addFavorite.useMutation();
  const logEvent = useAnalytics();
  const isFavorite = useIsModelIdFavorite(model?.id);
  const Icon = isFavorite ? StarOutlined : StarBorder;
  const toggleFavorite = async () => {
    const modelId = model.id;
    if (modelId) {
      if (isFavorite) {
        await removeFavorite(modelId);
        logEvent({ event: "artistFavorite", metadata: { artist: modelId } });
      } else {
        await addFavorite(modelId);
      }
      await refetch();
    }
  };

  return <Icon onClick={toggleFavorite} sx={{ fontSize: ICON_SIZE, cursor: "pointer", mr: 1 }} />;
};

const ModelDownloadIcon = ({ model }: { model: ArtistModelOption }) => {
  const isDownloaded = Boolean(model?.downloaded);

  const { refetch: refetchModels } = useModelList();
  const logEvent = useAnalytics();
  const { mutateAsync: downloadModel, isLoading: _isDownloading } = trpcReact.downloadSpecificModel.useMutation({
    mutationKey: ["download", model.id],
  });
  const { data: downloadStatus, refetch: refetchModelDownloadStatus } = useModelDownloadStatus(model);

  const modelName = model.name;

  const errorString = String(downloadStatus?.error || "");
  const isError = Boolean(errorString);

  const isDownloading = _isDownloading || Boolean(downloadStatus?.progress);
  React.useEffect(() => {
    if (isError && modelName) {
      toast.error(`Failed to download ${modelName}: ${errorString}`, {
        toastId: `downloadError-${modelName}`,
      });
    }
  }, [errorString, isError, modelName]);

  if (isDownloaded) {
    return null;
  }

  const onIconClick = async () => {
    if (isDownloaded && !isError) {
    } else {
      logEvent({ event: "modelDownload", metadata: { modelId: model.id } });
      await downloadModel(model);
      await refetchModelDownloadStatus();
      await refetchModels();
    }
  };

  const progress = downloadStatus?.progress;
  const fileByteCount = progress?.total || 1;
  const currentFileDownloadedBytes = progress?.loaded || 0;
  const currFilePercent = Math.round((currentFileDownloadedBytes * 100) / fileByteCount);

  const getIcon = () => {
    if (isError) {
      return <Close color={"error"} sx={{ fontSize: ICON_SIZE, color: theme.colors.error }} />;
    }
    if (isDownloading) {
      return (
        <CircularProgress
          color={"primary"}
          size={ICON_SIZE}
          variant={currFilePercent ? "determinate" : "indeterminate"}
          value={currFilePercent}
        />
      );
    }
    return <Download onClick={onIconClick} sx={{ cursor: "pointer", fontSize: ICON_SIZE * 1.5 }} />;
  };
  return (
    <Box
      sx={{
        px: 1,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          mb: isDownloading ? 1 : 0,
        }}
      >
        {getIcon()}
      </Box>
      <Box>
        <ModelDownloadStatusText model={model} notDownlodedText={isDownloading ? "Downloading..." : null} />
      </Box>
    </Box>
  );
};

const ModelInfo = ({ model }: { model: ArtistModelOption }) => {
  const metadata = model.metadata;
  const { epochs, classification, extra_info: extraMeta } = metadata || {};
  const name = model.name || model.id;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", justifyContent: "space-between" }}
    >
      <Box sx={{ display: "flex", alignItems: "start" }}>
        <FavoriteIcon model={model} />
        <Typography variant={"h2"}>{startCase(name)}</Typography>
      </Box>
      <Box
        display={"flex"}
        mt={1}
        justifyContent={"space-between"}
        gap={2}
        height={"100%"}
        width={"100%"}
        flexWrap={"wrap"}
      >
        <ArtistInfo title="File" value={`${model.id}.zip`} />
        {classification && <ArtistInfo title={"Classification"} value={startCase(classification)} />}
        {model.size !== 0 && model.size && <ArtistInfo title="Size" value={formatter(model.size)} />}
        {epochs !== 0 && epochs && <ArtistInfo title={"Epochs"} value={epochs} />}
        {Object.entries(extraMeta || {}).map(([key, value]) => {
          return <ArtistInfo key={key} title={startCase(key)} value={value} />;
        })}
      </Box>
    </Box>
  );
};
export const SelectedModel = () => {
  const model = useSelectedModel();
  const MENU_ID = `selected-model-delete-${model?.id}`;

  const { show } = useContextMenu({
    id: MENU_ID,
  });

  if (!model) {
    return null;
  }
  const isDownloaded = Boolean(model?.downloaded);
  function handleContextMenu(event: any) {
    if (isDownloaded) {
      show({ event });
    }
  }
  return (
    <Box
      onContextMenu={handleContextMenu}
      key={model.id}
      sx={{ p: 2, display: "flex", flexDirection: "row", minHeight: 80, alignItems: "start", gap: 0.5, width: "100%" }}
    >
      <ModelInfo model={model} />
      {!isDownloaded && <ModelDownloadIcon key={model.id} model={model} />}
      <ModelContextMenu model={model} id={MENU_ID} />
    </Box>
  );
};
