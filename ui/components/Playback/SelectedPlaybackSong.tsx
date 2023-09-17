import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";
import type { AdvancedOptions } from "../../context";
import { useReplay } from "../../context";
import { startCase } from "lodash-es";
import ShareButton from "../Share/ShareButton";
import { IconButton, Slider, Stack } from "@mui/material";
import { Edit, VolumeDown, VolumeUp } from "@mui/icons-material";
import SongEditModal from "./SongEditModal";
import { trpcReact } from "../../config/trpc";
import AudioPlayer from "./AudioPlayer.tsx";
import theme from "../theme";
import { useModelNameMap } from "../../hooks/dataHooks.ts";
import { getSongName } from "../SongList/SongEntry.tsx";
import Button from "@mui/material/Button";
import LaunchIcon from "@mui/icons-material/Launch";
function getDifferenceInMMSS(date1, date2) {
  const diff = Math.abs(date2.getTime() - date1.getTime()); // Difference in milliseconds
  const totalSeconds = Math.floor(diff / 1000); // Convert to seconds
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const minString = minutes === 0 ? "" : `${minutes.toString().padStart(2, "0")}m `;
  return `${minString}${seconds.toString().padStart(2, "0")}s`;
}
const formatter = new Intl.DateTimeFormat("en-US", {
  year: "2-digit",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true,
});

const RemixAgainButton = () => {
  const selectedPlaybackSongId = useReplay((state) => state.selectedPlaybackSongId);
  const setSongUrlOrFilePath = useReplay((state) => state.setSongUrlOrFilePath);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);
  const setModelId = useReplay((state) => state.setModelId);
  const setSelectedPlaybackSongId = useReplay((state) => state.setSelectedPlaybackSongId);
  const { data: selectedPlaybackSong } = trpcReact.getSong.useQuery(selectedPlaybackSongId || "");
  if (!selectedPlaybackSong) {
    return null;
  }
  const { modelId, options, originalRawInput } = selectedPlaybackSong;

  if (!originalRawInput) {
    return null;
  }
  return (
    <Button
      sx={{ borderRadius: "12px" }}
      variant={"contained"}
      onClick={() => {
        setModelId(modelId);
        if (options) {
          setAdvancedOptions(options as AdvancedOptions);
        }
        setSongUrlOrFilePath(originalRawInput);
        setSelectedPlaybackSongId(null);
      }}
    >
      Remix Again
    </Button>
  );
};

export const SelectedPlaybackSong = () => {
  const selectedPlaybackSongId = useReplay((state) => state.selectedPlaybackSongId);
  const volume = useReplay((state) => state.volume);
  const setVolume = useReplay((state) => state.setVolume);

  const { data: selectedPlaybackSong, refetch } = trpcReact.getSong.useQuery(selectedPlaybackSongId || "");

  const [isEditing, setIsEditing] = React.useState(false);
  const modelNameMap = useModelNameMap();

  if (!selectedPlaybackSong) {
    return null;
  }
  const {
    dateCompleted,
    dateStarted,
    modelId,
    id,
    originalVocalsPath,
    convertedVocalsPath,
    instrumentalsPath,
    preDeechoVocalsFile,
    songPath,
    options,
    youtubeUrl,
  } = selectedPlaybackSong;
  const modelName = modelNameMap[modelId] || modelId;
  const date = new Date(dateStarted ?? 0);
  const endDate = new Date(dateCompleted ?? 0);

  const endedText = formatter.format(endDate);
  const name = getSongName(selectedPlaybackSong);

  const getSubtitle = () => {
    const texts: string[] = [`Processed in ${getDifferenceInMMSS(date, endDate)}`];
    if (options) {
      if (options.sampleMode) {
        texts.push(`Sample Mode (30s)`);
      }
      if (options.pitch) {
        texts.push(`Pitch: ${options.pitch}`);
      }
      if (options.instrumentalsPitch) {
        texts.push(`Instrumentals Pitch: ${options.instrumentalsPitch}`);
      }
      if (options.vocalsOnly) {
        texts.push(`Vocals Only`);
      }
      if (options.preStemmed) {
        texts.push(`Pre-Stemmed`);
      }
      if (options.f0Method) {
        texts.push(`F0 Method: ${options.f0Method}`);
      }
      if (options.indexRatio) {
        texts.push(`Index Ratio: ${options.indexRatio}`);
      }
    }
    return texts.join(" • ");
  };
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
        p: 3,
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
      {isEditing && (
        <SongEditModal
          song={selectedPlaybackSong}
          onClose={() => {
            refetch();
            setIsEditing(false);
          }}
        />
      )}
      <Box
        sx={{
          zIndex: 999,
          background: theme.colors.background,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minWidth: 480,
          maxWidth: 720,
          height: "fit-content",
        }}
      >
        <Typography variant={"h1"}>Created Track</Typography>
        {songPath && (
          <>
            <Box sx={{ backgroundColor: "#2c2c2c", p: 2, borderRadius: "16px", mt: 2 }}>
              {/* Image/Title Stack */}
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "start", gap: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#646464",
                    borderRadius: "16px",
                    height: 120,
                    width: 120,
                    minWidth: 120,
                  }}
                >
                  <Typography sx={{ fontSize: 80 }}>💿</Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {/* Title */}
                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                    <Typography variant={"h1"}>{name}</Typography>
                    <IconButton
                      onClick={() => {
                        setIsEditing(true);
                      }}
                    >
                      <Edit color="disabled" />
                    </IconButton>
                  </Box>
                  {/* Description */}
                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
                    {modelName && (
                      <>
                        <Typography variant={"body1"}>Remixed as:</Typography>
                        <Box sx={{ backgroundColor: "#646464", px: 1, py: 0.5, borderRadius: "6px" }}>
                          {startCase(modelName)}
                        </Box>
                      </>
                    )}
                    {youtubeUrl && (
                      <a href={youtubeUrl} target={"_blank"} rel="noreferrer">
                        <Box
                          sx={{
                            backgroundColor: "#646464",
                            px: 1,
                            py: 0.5,
                            borderRadius: "6px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          YouTube <LaunchIcon fontSize={"medium"} sx={{ pl: 1 }} />
                        </Box>
                      </a>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, mt: 1 }}>
                    <RemixAgainButton />
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start", gap: 1, mt: 1 }}>
                    <Typography variant={"body2"} sx={{ color: "#ccc" }}>
                      {endedText}
                    </Typography>
                    <Typography variant={"body2"} sx={{ color: "#ccc", display: "flex" }}>
                      {getSubtitle()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {/* Waveform */}
              <AudioPlayer song={selectedPlaybackSong} type="song" waveform />
              {/* Share button */}
              <Box sx={{ display: "flex", flexGrow: 1, mt: 3, alignItems: "end" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Typography variant={"body2"} sx={{ color: "#ccc" }}>
                    Made with
                  </Typography>
                  <Typography variant={"body1"} sx={{ fontWeight: 700, fontSize: 24, letterSpacing: "-1px" }}>
                    Replay
                  </Typography>
                </Box>
                <Stack spacing={1.5} direction="row" sx={{ ml: "auto", mr: "auto", minWidth: 200 }} alignItems="center">
                  <VolumeDown />
                  <Slider
                    min={0}
                    max={1}
                    aria-label="Volume"
                    value={volume}
                    step={0.01}
                    onChange={(e, value) => setVolume(value as number)}
                    sx={{ color: "white" }}
                  />
                  <VolumeUp />
                </Stack>
                <Box sx={{ ml: "auto" }}>
                  <ShareButton songId={id} />
                </Box>
              </Box>
            </Box>
          </>
        )}
        <Box sx={{ mt: 3, mb: 1 }}>
          <Typography variant={"h1"}>Source Tracks</Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: "#2c2c2c",
            p: 2,
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
          key={selectedPlaybackSong.id}
        >
          <AudioPlayer song={selectedPlaybackSong} type="original_song" />
          {convertedVocalsPath && <AudioPlayer song={selectedPlaybackSong} type="converted_vocals" />}
          {originalVocalsPath && <AudioPlayer song={selectedPlaybackSong} type="original_vocals" />}
          {preDeechoVocalsFile && <AudioPlayer song={selectedPlaybackSong} type="pre_deecho_original_vocals" />}
          {instrumentalsPath && <AudioPlayer song={selectedPlaybackSong} type="instrumentals" />}
        </Box>
      </Box>
    </Box>
  );
};
