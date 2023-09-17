import type { DropzoneState } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import theme, { baseThemeOptions } from "../theme";
import React, { useCallback, useEffect } from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Chip, InputBase } from "@mui/material";
import type { AdvancedOptions } from "../../context";
import { useReplay } from "../../context";
import { trpcReact } from "../../config/trpc";
import { AudioRecorder } from "../AudioRecorder";
import { toast } from "react-toastify";
import type { MediaAudioTrackConstraints } from "../AudioRecorder/hooks/useAudioRecorder";
import { CloudUploadRounded } from "@mui/icons-material";
import { useAnalytics } from "../../hooks/useAnalytics";

const getColor = ({ isDragAccept, isDragReject, isFocused }: DropzoneState) => {
  if (isDragAccept) {
    return baseThemeOptions.colors.lightGreen;
  }
  if (isDragReject) {
    return baseThemeOptions.palette.error.main;
  }
  if (isFocused) {
    return "#2196f3";
  }
  return "#cbd5e0";
};
export const DropContainer = styled("div")`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  border-color: ${(props: DropzoneState) => getColor(props)};
  background-color: #3c3c3c;
  color: #c9c9c9;
  outline: none;
  transition: border 0.24s ease-in-out;
  cursor: pointer;
  width: 100%;
  border-radius: 12px;
  justify-content: center;
  flex-grow: 1;
`;

const FileDropper = ({ onSelect }: SongSelectProps) => {
  const options = useReplay((state) => state.options);

  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onSelect(acceptedFiles[0].path);
      if (options.preStemmed) {
        setAdvancedOptions({
          ...options,
          preStemmed: false,
        } as AdvancedOptions);
      }
    },
    [onSelect, options, setAdvancedOptions],
  );

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } = useDropzone({
    accept: { "audio/*": [], "video/*": [] },
    onDrop,
    useFsAccessApi: false,
  });

  return (
    <DropContainer {...(getRootProps({ isFocused, isDragAccept, isDragReject }) as any)}>
      <input {...getInputProps()} />
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: "4px", gap: "2px" }}>
        <CloudUploadRounded fontSize="large" />
        <Typography variant={"body2"} sx={{ whiteSpace: "pre" }}>
          Select or drop audio here
        </Typography>
      </Box>
    </DropContainer>
  );
};

export interface SongSelectProps {
  onSelect: (url: string) => void;
  songUrlOrFilePath: string | null;
}

const YoutubeUrlInput = ({ onSelect, songUrlOrFilePath }: SongSelectProps) => {
  const options = useReplay((state) => state.options);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);
  const isYoutubeUrl = songUrlOrFilePath?.trim().match(/^(http|https):\/\/[^ "]+$/);
  return (
    <InputBase
      sx={{
        width: "100%",
        px: 2,
        height: 50,
        background: "#3c3c3c",
        display: "flex",
        borderRadius: "12px",
        color: "white",
      }}
      inputProps={{
        sx: { p: 0, height: 50, color: theme.colors.white, background: "#3c3c3c", borderRadius: "5px" },
      }}
      onChange={(e) => {
        onSelect(e.target.value.trim());
        // Change back pre-stemmed if selected
        if (options.preStemmed) {
          setAdvancedOptions({
            ...options,
            preStemmed: false,
          } as AdvancedOptions);
        }
      }}
      defaultValue={isYoutubeUrl ? songUrlOrFilePath : undefined}
      placeholder={"Enter YouTube URL"}
    />
  );
};
async function blobToBuffer(blob: Blob) {
  if (typeof Blob === "undefined" || !(blob instanceof Blob)) {
    throw new Error("first argument must be a Blob");
  }

  const reader = new FileReader();

  return new Promise<Uint8Array>((resolve, reject) => {
    function onLoadEnd() {
      reader.removeEventListener("loadend", onLoadEnd, false);
      if (!reader.result) {
        reject(new Error("Empty file"));
      } else {
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      }
    }

    reader.addEventListener("loadend", onLoadEnd, false);
    reader.addEventListener("error", reject, false);
    reader.readAsArrayBuffer(blob);
  });
}
const audioTrackConstraints = {
  noiseSuppression: true,
  echoCancellation: true,
} as MediaAudioTrackConstraints;
const mediaRecorderOptions = { mimeType: "audio/webm;codecs=pcm" } as MediaRecorderOptions;
const MicRecorder = ({ onSelect }: SongSelectProps) => {
  const { mutateAsync } = trpcReact.saveAudioFileForProcessing.useMutation();
  const options = useReplay((state) => state.options);
  const setAdvancedOptions = useReplay((state) => state.setAdvancedOptions);

  const preStemmedSetOnce = React.useRef(false);
  const lastProcessedBlob = React.useRef<Blob>();

  const addAudioElement = React.useCallback(
    async (blob: Blob) => {
      if (lastProcessedBlob.current === blob) {
        return;
      }
      lastProcessedBlob.current = blob;
      const buffer = await blobToBuffer(blob);
      const res = await mutateAsync({ buffer, type: blob.type });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      onSelect(res.url);
      if (!options.preStemmed && !preStemmedSetOnce.current) {
        setAdvancedOptions({
          ...options,
          preStemmed: true,
        } as AdvancedOptions);
        preStemmedSetOnce.current = true;
      }
    },
    [mutateAsync, onSelect, options, setAdvancedOptions],
  );

  return (
    <AudioRecorder
      onRecordingComplete={addAudioElement}
      audioTrackConstraints={audioTrackConstraints}
      mediaRecorderOptions={mediaRecorderOptions}
      onNotAllowedOrFound={(err) => console.table(err)}
    />
  );
};

export const SongSelector = () => {
  const onSelect = useReplay((state) => state.setSongUrlOrFilePath);
  const logEvent = useAnalytics();
  const songUrlOrFilePath = useReplay((state) => state.songUrlOrFilePath);
  const filename = songUrlOrFilePath?.replace(/^.*([\\/:])/, "");
  const isUUidv4 = songUrlOrFilePath?.match(/Recorded Audio/i);
  const isUrl = songUrlOrFilePath?.match(/^(http|https):\/\/[^ "]+$/);
  const songSelectionText = `${isUUidv4 ? "Custom audio recording" : isUrl ? "URL" : filename}`;

  useEffect(() => {
    if (songUrlOrFilePath) {
      const isRecorded = songUrlOrFilePath?.match(/Recorded Audio/i);
      const isYoutube = songUrlOrFilePath?.match(/^(http|https):\/\/[^ "]+$/);
      logEvent({
        event: "audioSelected",
        metadata: { source: `${isRecorded ? "recording" : isYoutube ? "youtube" : "file"}` },
      });
    }
  }, [isUUidv4, isUrl, logEvent, songUrlOrFilePath]);

  return (
    <Box
      sx={{
        zIndex: 999,
        background: "#2c2c2c",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "start",
        mt: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", gap: 1 }}>
        <Typography variant={"h4"}>{songUrlOrFilePath ? "Audio selected: " : "Select Audio"}</Typography>
        {songUrlOrFilePath && <Chip color="primary" onDelete={() => onSelect(null)} label={songSelectionText} />}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between", mt: 1 }}>
        <Box
          sx={{ display: "flex", alignItems: "center", width: "50%", justifyContent: "center", mr: 1, minHeight: 80 }}
        >
          <FileDropper onSelect={onSelect} songUrlOrFilePath={songUrlOrFilePath} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", width: "50%", justifyContent: "center", minHeight: 80 }}>
          <MicRecorder onSelect={onSelect} songUrlOrFilePath={songUrlOrFilePath} />
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
        <Typography sx={{ my: 0.5, fontSize: 12 }} variant={"body1"}>
          or
        </Typography>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}>
        <YoutubeUrlInput onSelect={onSelect} songUrlOrFilePath={songUrlOrFilePath} key={songUrlOrFilePath} />
      </Box>
    </Box>
  );
};
