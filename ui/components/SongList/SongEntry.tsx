import { useReplay } from "../../context";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";
import path from "path-browserify";
import { Menu, Item, useContextMenu } from "react-contexify";
import { trpcReact } from "../../config/trpc";
import { IconButton } from "@mui/material";
import { MoreHoriz } from "@mui/icons-material";
import { startCase } from "lodash-es";
import SongEditModal from "../Playback/SongEditModal";
import { useModelNameMap } from "../../hooks/dataHooks.ts";
import { toast } from "react-toastify";
import { useAnalytics } from "../../hooks/useAnalytics.ts";
import type { SavedSong } from "@replay/electron/data/db-types.ts";

export const SONG_ENTRY_HEIGHT = 65;

export interface SongEntryProps {
  style?: React.CSSProperties;
  song: SavedSong;
}

export const getSongName = (song: SavedSong) => {
  let filename = song.parsedTrackName || path.parse(song.songPath || song.originalFilePath).name;
  if (filename.startsWith("Recorded Audio")) {
    filename = `Custom Recording as ${song.modelId}`;
  }
  const name = song.displayName || startCase(filename);
  return name;
};

const getPreviewText = (song: SavedSong | undefined, modelName: string) => {
  if (!song) {
    return "";
  }
  const date = new Date(song?.dateStarted ?? 0);
  const timeString = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const text = [startCase(modelName), date.toLocaleDateString(), timeString].filter(Boolean);

  return text.join(" • ");
};

export const SongEntry = ({ song, style }: SongEntryProps) => {
  const selectedPlaybackSongId = useReplay((state) => state.selectedPlaybackSongId);
  const [isEditing, setIsEditing] = React.useState(false);

  const { mutateAsync: deleteSong } = trpcReact.deleteSong.useMutation();
  const { mutateAsync: copyFileToDownloads } = trpcReact.copyFileToDownloads.useMutation();
  const { refetch } = trpcReact.createdSongList.useQuery();
  const setSelectedPlaybackSongId = useReplay((state) => state.setSelectedPlaybackSongId);
  const logEvent = useAnalytics();
  const modelNameMap = useModelNameMap();
  const MENU_ID = `song-${song.id}`;

  const { show } = useContextMenu({
    id: MENU_ID,
  });
  const modelId = song?.modelId || "";
  const text = React.useMemo(
    () => getPreviewText(song, modelNameMap[modelId] || modelId),
    [modelId, modelNameMap, song],
  );

  if (!song) {
    return null;
  }

  function handleContextMenu(event: any) {
    show({ event });
  }

  const name = getSongName(song);

  const isSelected = Boolean(song.id === selectedPlaybackSongId);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        style={style}
        onContextMenu={handleContextMenu}
      >
        <Box sx={{ display: "inline-flex", whiteSpace: "pre", textOverflow: "ellipsis", alignItems: "center" }}>
          <Typography sx={{ textOverflow: "ellipsis", fontWeight: "bold", display: "inline-flex" }} variant={"h5"}>
            {name}
          </Typography>
        </Box>
        {text && (
          <Typography
            sx={{
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              color: isSelected ? "white" : "#a8a8a8",
              whiteSpace: "pre",
            }}
            variant={"body2"}
          >
            {text}
          </Typography>
        )}
      </Box>
      <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "right" }}>
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            handleContextMenu(event);
          }}
        >
          <MoreHoriz color={isSelected ? "secondary" : "disabled"} />
        </IconButton>
      </Box>
      <Menu id={MENU_ID} style={{ zIndex: 1000 }}>
        <Item
          id={`edit-${song.id}`}
          onClick={() => {
            setSelectedPlaybackSongId(song.id);
            setIsEditing(true);
          }}
        >
          Edit
        </Item>
        <Item
          id={`remove-${song.id}`}
          onClick={async () => {
            await deleteSong(song.id);
            await refetch();
            if (isSelected) {
              setSelectedPlaybackSongId(null);
            }
          }}
        >
          Delete
        </Item>
        {song.songPath && (
          <Item
            id={`downloads-${song.id}`}
            onClick={async () => {
              if (song.songPath) {
                const toastId = song.songPath;
                toast.info(`Copying to Downloads`, { toastId });
                try {
                  await copyFileToDownloads({ song, type: "song" });
                  logEvent({ event: "audioDownload", metadata: { type: "song" } });
                  toast.success(`Copied to Downloads`, { toastId });
                } catch (e) {
                  toast.error(`Failed to copy to Downloads`, { toastId });
                }
              }
            }}
          >
            Save to Downloads
          </Item>
        )}
      </Menu>
      {isEditing && <SongEditModal song={song} onClose={() => setIsEditing(false)} />}
    </>
  );
};
