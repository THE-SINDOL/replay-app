import { DownloadOutlined, Pause, PlayArrow } from "@mui/icons-material";
import { Box, IconButton, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
import type { WaveSurferOptions } from "wavesurfer.js";
import WaveSurfer from "wavesurfer.js";
import { useAnalytics } from "../../hooks/useAnalytics";
import { trpcReact } from "../../config/trpc";
import { toast } from "react-toastify";
import type { FileType } from "@replay/electron/data/database";
import { useReplay } from "../../context.tsx";
import AudioPlayerReact from "react-h5-audio-player";
import "./overrides.less";
import type { SavedSong } from "@replay/electron/data/db-types.ts";
const formWaveSurferOptions = (ref): WaveSurferOptions => ({
  container: ref,
  waveColor: "#646464",
  progressColor: "#eee",
  barWidth: 4,
  barRadius: 40,
  cursorWidth: 0,
  height: 65,
  // If true, normalize by the maximum peak instead of 1.0.
  normalize: true,
  hideScrollbar: true,
  sampleRate: 3000,
  autoplay: false,
});

const getFilePathForType = (song: SavedSong, type: FileType) => {
  const {
    originalVocalsPath,
    originalFilePath,
    convertedVocalsPath,
    instrumentalsPath,
    preDeechoVocalsFile,
    songPath,
  } = song;

  switch (type) {
    case "original_vocals":
      return originalVocalsPath ? originalVocalsPath : null;
    case "converted_vocals":
      return convertedVocalsPath ? convertedVocalsPath : null;
    case "pre_deecho_original_vocals":
      return convertedVocalsPath ? preDeechoVocalsFile : null;
    case "instrumentals":
      return instrumentalsPath ? instrumentalsPath : null;
    case "original_song":
      return originalFilePath ? originalFilePath : null;
    case "song":
      return songPath ? songPath : null;
    default:
      return null;
  }
};

const WaveformComponent = ({ filePath }: { filePath: string | null }) => {
  const waveformRef = useRef(null);
  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const volume = useReplay((state) => state.volume);
  const [playing, setPlay] = useState(false);
  const pause = useCallback(() => {
    setPlay(false);
  }, []);
  const play = useCallback(() => {
    setPlay(true);
  }, []);
  const logEvent = useAnalytics();

  const handlePlayPause = () => {
    setPlay((wasPlaying) => {
      const shouldPlay = !wasPlaying;
      if (shouldPlay) {
        logEvent({ event: "playSong" });
      }
      return shouldPlay;
    });
  };

  useEffect(() => {
    wavesurfer?.setVolume(volume);
  }, [wavesurfer, volume]);

  useEffect(() => {
    // On component mount and when url changes
    if (filePath) {
      // create new WaveSurfer instance
      const options = formWaveSurferOptions(waveformRef.current);
      options.url = filePath;
      const ws = WaveSurfer.create(options);

      setWavesurfer(ws);
      ws.load(filePath);

      return () => {
        // Remove the 'finish' event handler before destroying the WaveSurfer instance
        if (ws) {
          ws.destroy();
        }
      };
    }
  }, [filePath]);

  useEffect(() => {
    if (!wavesurfer) {
      return;
    }
    // Attach the 'finish' event handler
    wavesurfer.on("finish", pause);
    wavesurfer.on("pause", pause);
    wavesurfer.on("play", play);
    return () => {
      wavesurfer.un("finish", pause);
      wavesurfer.un("pause", pause);
      wavesurfer.un("play", play);
    };
  }, [pause, play, wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) {
      return;
    }
    if (playing && !wavesurfer.isPlaying()) {
      wavesurfer.play();
    } else if (!playing && wavesurfer.isPlaying()) {
      wavesurfer.pause();
    }
  }, [wavesurfer, playing]);

  return (
    <>
      <IconButton
        size="large"
        sx={{
          backgroundColor: "#eee",
          "&:hover": {
            backgroundColor: "#646464",
          },
        }}
        onClick={handlePlayPause}
      >
        {!playing ? <PlayArrow /> : <Pause />}
      </IconButton>
      <Box
        sx={{
          width: "100%",
        }}
        id="waveform"
        ref={waveformRef}
      />
    </>
  );
};
const filePrefix = "file://";
export default function AudioPlayer({ song, type, waveform }: { waveform?: boolean; song: SavedSong; type: FileType }) {
  const logEvent = useAnalytics();
  const { mutateAsync: copyFileToDownloads } = trpcReact.copyFileToDownloads.useMutation();
  const dbFilePath = getFilePathForType(song, type);
  const { data: _filePath } = trpcReact.getPreviewSong.useQuery(dbFilePath);
  const filePath = _filePath ? filePrefix + _filePath : null;
  let title: string = "";
  switch (type) {
    case "original_song":
      title = "Original Song";
      break;
    case "original_vocals":
      title = "Original Vocals";
      break;
    case "pre_deecho_original_vocals":
      title = "Pre Deecho Vocals";
      break;
    case "converted_vocals":
      title = "Converted Vocals";
      break;
    case "instrumentals":
      title = "Instrumentals";
      break;
  }

  const handleFileDownload = async () => {
    const toastId = song.songPath;
    try {
      await copyFileToDownloads({ song, type });
      logEvent({ event: "audioDownload", metadata: { type } });
      toast.info(`Copied to Downloads`, { toastId });
    } catch (e) {
      toast.error(`Failed to copy to Downloads: ${e}`, { toastId });
    }
  };

  return (
    <>
      {title && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant={"h3"}>{title}</Typography>
          <IconButton
            size="small"
            sx={{
              backgroundColor: "#646464",
              "&:hover": {
                backgroundColor: "#eee",
              },
            }}
            onClick={handleFileDownload}
          >
            <DownloadOutlined />
          </IconButton>
        </Box>
      )}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          width: "100%",
          mt: title ? 0 : 2,
          mb: title ? 2 : 0,
        }}
      >
        {waveform && filePath && <WaveformComponent filePath={filePath} />}
        {!waveform && filePath && (
          <AudioPlayerReact
            preload={"metadata"}
            src={filePath}
            autoPlayAfterSrcChange={false}
            customAdditionalControls={[]}
          />
        )}
      </Box>
    </>
  );
}
