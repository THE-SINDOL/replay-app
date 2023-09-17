import type { ArtistModelOption } from "@replay/electron/clients/modelWeights.ts";
import { useReplay } from "../../../context.tsx";
import { useAnalytics } from "../../../hooks/useAnalytics.ts";
import { trpcReact } from "../../../config/trpc.ts";
import { useIsModelIdFavorite, useModelList } from "../../../hooks/dataHooks.ts";
import * as React from "react";
import { Item, Menu, useContextMenu } from "react-contexify";
import { sizeFormatter as formatter } from "../../../utils/sizeFormatter.ts";
import { StarBorder, StarOutlined } from "@mui/icons-material";
import { startCase } from "lodash-es";
import Box from "@mui/material/Box";
import theme from "../../theme.ts";
import Typography from "@mui/material/Typography";
import { ModelDownloadStatusText } from "./shared.tsx";
import { toast } from "react-toastify";

export const ModelContextMenu = ({ id, model }: { id: string; model: ArtistModelOption }) => {
  const currentSelectedModelId = useReplay((state) => state.modelId);
  const isSelected = currentSelectedModelId === model.id;
  const { refetch: refetchModels } = useModelList();
  const { mutateAsync: removeModel } = trpcReact.removeModel.useMutation();
  const { mutateAsync: showModelInFinder } = trpcReact.showModelInFinder.useMutation();
  const setModelId = useReplay((state) => state.setModelId);

  return (
    <Menu id={id}>
      <Item
        id={`remove-${model.id}`}
        onClick={async () => {
          toast.info(`Removing ${model.name}`);
          await removeModel(model.id);
          refetchModels();
          toast.success(`Removed ${model.name}`);
          if (isSelected) {
            setModelId(null);
          }
        }}
      >
        Delete
      </Item>
      <Item
        id={`show-${model.id}`}
        onClick={async () => {
          await showModelInFinder(model.id);
        }}
      >
        Show in finder
      </Item>
    </Menu>
  );
};

export const Model = ({ model }: { model: ArtistModelOption }) => {
  const currentSelectedModelId = useReplay((state) => state.modelId);
  const isSelected = currentSelectedModelId === model.id;
  const setModelId = useReplay((state) => state.setModelId);
  const logEvent = useAnalytics();
  const isDownloaded = Boolean(model.downloaded);

  const MENU_ID = `menu-${model.id}`;
  const isFavorite = useIsModelIdFavorite(model.id);

  const { show } = useContextMenu({
    id: MENU_ID,
  });

  function handleContextMenu(event: any) {
    if (isDownloaded) {
      show({ event });
    }
  }

  const onClick = async () => {
    logEvent({ event: "modelSelect", metadata: { modelId: model.id, modelName: model.name } });
    setModelId(model.id);
  };

  const sizeInfo = model.size ? formatter(model.size) : "";
  const sizeString = sizeInfo ? ` - ${sizeInfo}` : "";
  const modelTitle = startCase(model.name);
  const FavoriteIcon = isFavorite ? StarOutlined : StarBorder;

  return (
    <>
      <Box
        sx={{
          borderRadius: 3,
          backgroundColor: isSelected ? theme.palette.primary.main : "#646464",
          py: 1,
          px: 1.5,
          my: 0.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          cursor: "pointer",
        }}
        onClick={onClick}
        onContextMenu={handleContextMenu}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start", gap: 0.1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isFavorite && <FavoriteIcon sx={{ fontSize: 18, cursor: "pointer" }} />}
            <Typography variant="h4" sx={{ fontWeight: 500, display: "flex", alignItems: "center" }}>
              {modelTitle}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 300 }}>
            <ModelDownloadStatusText model={model} notDownlodedText={"Not Downloaded"} />
            {sizeString}
          </Typography>
        </Box>
      </Box>
      <ModelContextMenu model={model} id={MENU_ID} />
    </>
  );
};
