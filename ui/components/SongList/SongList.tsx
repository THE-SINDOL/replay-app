import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import { getSongName, SONG_ENTRY_HEIGHT, SongEntry } from "./SongEntry";
import { GroupedVirtuoso, Virtuoso } from "react-virtuoso";
import { Wordmark } from "../Logo/Logo";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { trpcReact } from "../../config/trpc";
import { useReplay } from "../../context";
import { ErrorBoundary } from "../ErrorBoundary.tsx";
import { selectTheme } from "../Select/select.tsx";
import Select from "react-select";
import { groupBy, startCase } from "lodash-es";
import { useModelNameMap } from "../../hooks/dataHooks.ts";
import discordImage from "../../../assets/discord-mark-white.png";
import theme from "../theme.ts";
import { COLLAPSED_HEIGHT } from "../JobQueue/JobQueueDisplay.tsx";
import type { SavedSong } from "@replay/electron/data/db-types.ts";

export const SONG_LIST_WIDTH = 320;
export const SongListWrapper = ({ children }: React.PropsWithChildren) => {
  return (
    <Box
      className={"draggable"}
      display={"flex"}
      sx={{
        display: "flex",
        overflowY: "auto",
        overflowX: "hidden",
        height: "100%",
        pt: 5,
        width: SONG_LIST_WIDTH,
        minWidth: SONG_LIST_WIDTH,
        alignItems: "center",
        borderTopRightRadius: "50px",
      }}
      flexDirection={"column"}
    >
      {children}
    </Box>
  );
};

const VirtualizedList = ({ songs }: { songs: undefined | SavedSong[] }) => {
  const count = songs?.length ?? 0;
  const selectedPlaybackSongId = useReplay((state) => state.selectedPlaybackSongId);
  const songListSort = useReplay((state) => state.songListSort);
  const setSelectedPlaybackSongId = useReplay((state) => state.setSelectedPlaybackSongId);
  const modelNameMap = useModelNameMap();
  const groupByData = useMemo(() => {
    if (songListSort === "model") {
      return groupBy(songs, (song) => modelNameMap[song.modelId] || song.modelId);
    }
    if (songListSort === "track") {
      return groupBy(songs, (song) => song.songHash || song.parsedTrackName);
    }
    return {};
  }, [songs, modelNameMap, songListSort]);
  const itemContent = (_: number, song: SavedSong) => {
    if (!song) {
      return null;
    }
    const isSelected = Boolean(song.id === selectedPlaybackSongId);

    return (
      <Box
        sx={{
          background: isSelected ? "#148aff" : undefined,
          display: "flex",
          flexDirection: "row",
          py: 1,
          px: 2,
          mx: 1,
          width: SONG_LIST_WIDTH - 16,
          height: SONG_ENTRY_HEIGHT,
          minHeight: SONG_ENTRY_HEIGHT,
          overflow: "hidden",
          borderRadius: 1,
          alignItems: "center",
          cursor: "pointer",
        }}
        key={`${song.id}-${songListSort}`}
        onClick={() => {
          if (isSelected) {
            setSelectedPlaybackSongId(null);
          } else {
            setSelectedPlaybackSongId(song.id);
          }
        }}
      >
        <ErrorBoundary>
          <SongEntry song={song} />
        </ErrorBoundary>
      </Box>
    );
  };

  if (!count) {
    return null;
  }

  if (songListSort === "date") {
    return (
      <Virtuoso
        increaseViewportBy={2000}
        style={{ height: "100%", width: "100%" }}
        data={songs}
        itemContent={itemContent}
        overscan={100}
      />
    );
  }

  const groups = Object.keys(groupByData);
  const groupNames = groups.map((l) => {
    if (songListSort === "model") {
      return startCase(l);
    }
    if (songListSort === "track") {
      return getSongName(groupByData[l][0]);
    }
  });
  const songsByGroup = Object.values(groupByData).flat();
  const groupCounts = groups.map((key) => groupByData[key]?.length || 0);

  return (
    <GroupedVirtuoso
      groupCounts={groupCounts}
      overscan={100}
      style={{ height: "100%", width: "100%", marginTop: 8 }}
      groupContent={(index) => {
        const name = groupNames[index];
        return (
          <Typography
            key={`${name}-${songListSort}`}
            variant={"h6"}
            sx={{
              px: 2,
              py: 1,
              background: theme.colors.background,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            {name}
          </Typography>
        );
      }}
      itemContent={(index) => {
        return itemContent(index, songsByGroup[index]);
      }}
    />
  );
};

const CreateSongButton = () => {
  const setSelectedPlaybackSongId = useReplay((state) => state.setSelectedPlaybackSongId);

  return (
    <Button
      sx={{ mx: 1, my: 3, width: "80%", borderRadius: "12px" }}
      variant={"contained"}
      onClick={() => setSelectedPlaybackSongId(null)}
    >
      New Song
    </Button>
  );
};

const JoinDiscordButton = () => {
  return (
    <Box sx={{ mt: -1, mb: 2 }}>
      <a href="https://discord.gg/A5rgNwDRd4" target="_blank" rel="noreferrer">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2">Join the Replay Discord</Typography>
          <img src={discordImage} width={20} height={15} />
        </Box>
      </a>
    </Box>
  );
};

const SORT_OPTIONS = [
  { value: "date", label: "Sort by Date" },
  { value: "model", label: "Group by Model" },
  { value: "track", label: "Group by Song" },
] as const;

const LibraryDisplay = () => {
  const { data } = trpcReact.createdSongList.useQuery(undefined, { placeholderData: [] });
  const songListSort = useReplay((state) => state.songListSort);
  const setSongListSort = useReplay((state) => state.setSongListSort);

  const atLeastOneCompletedSong = Boolean((data || []).find((l) => l.status === "completed"));

  const songs = (data || []).filter((song) => song.status === "completed");
  return (
    <>
      <Typography sx={{ fontWeight: 600, my: 1, ml: 3, alignSelf: "start" }} variant={"h3"}>
        Your Library
      </Typography>
      {!atLeastOneCompletedSong ? (
        <Typography>No songs yet!</Typography>
      ) : (
        <Box sx={{ px: 2, width: "100%", zIndex: 999, mb: 2 }}>
          <Select<(typeof SORT_OPTIONS)[number]>
            theme={selectTheme}
            name={"sort"}
            value={SORT_OPTIONS.find((l) => l.value === songListSort)}
            placeholder={"Sort"}
            blurInputOnSelect
            options={SORT_OPTIONS}
            onChange={(value) => {
              if (value) {
                setSongListSort(value.value);
              }
            }}
            styles={{
              option: (baseStyles, state) => ({
                ...baseStyles,
                color: state.isSelected ? "white" : baseStyles.color,
              }),
            }}
            getOptionLabel={(option) => startCase(option.label)}
            getOptionValue={(option) => option.value}
            onBlur={() => {}}
          />
        </Box>
      )}
      <ErrorBoundary>
        <Box sx={{ width: "100%", height: "100%", paddingBottom: `${COLLAPSED_HEIGHT}px` }}>
          <VirtualizedList key={songListSort} songs={songs} />
        </Box>
      </ErrorBoundary>
    </>
  );
};

export const SongList = () => {
  return (
    <SongListWrapper>
      <Wordmark showVersion />
      <CreateSongButton />
      <JoinDiscordButton />
      <LibraryDisplay />
    </SongListWrapper>
  );
};
