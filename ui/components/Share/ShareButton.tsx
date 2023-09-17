import { Box, Button, CircularProgress, IconButton, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { trpcReact, trpcWeb } from "../../config/trpc";
import { toast } from "react-toastify";
import { Link } from "@mui/icons-material";
import { useAnalytics } from "../../hooks/useAnalytics";
import { getSongName } from "../SongList/SongEntry";

const BASE_SHARE_URL = "tryreplay.io/share/";

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.info("Copied to clipboard!");
    })
    .catch(() => {
      toast.error("Failed to copy to clipboard");
    });
}

const ShareButton = ({ songId }: { songId: string }) => {
  const { data: song, refetch } = trpcReact.getSong.useQuery(songId);
  const logEvent = useAnalytics();
  const { mutateAsync, isLoading: isUploading } = trpcReact.uploadSong.useMutation();
  const { mutateAsync: updateShareId } = trpcReact.updateSongShareId.useMutation();

  useEffect(() => {
    const fetchExistingShareId = async (songId: string) => {
      const existingShareId: string | null = await trpcWeb.getExistingShareId.query(songId);
      if (existingShareId) {
        // Flush Share ID
        await updateShareId({ songId, shareId: existingShareId });
        await refetch();
      }
    };
    if (!songId) {
      fetchExistingShareId(songId);
    }
  }, [refetch, songId, updateShareId]);

  if (!song) {
    return null;
  }

  const songPath = song.songPath;
  const date = new Date(song?.dateStarted ?? 0);
  const startedText = date.toLocaleDateString() + " " + date.toLocaleTimeString();
  const name = getSongName(song);

  const processShare = async () => {
    const { signedUrl, shareId } = await trpcWeb.getUploadUrl.query(song.id);
    // Upload file to S3
    let responseStatus = 200;
    if (signedUrl) {
      responseStatus = await mutateAsync({ signedUrl, song });
    }
    // If we get a successful response, then we can flush and share the link
    if (responseStatus == 200) {
      await trpcWeb.flushUploadedSong.query({
        shareId,
        metadata: {
          id: song.id,
          modelId: song.modelId,
          modelName: song.modelName,
          songPath: songPath || "",
          dateStarted: startedText,
          originalFilePath: song.originalFilePath,
          displayName: name,
        },
      });
      // Now set the share ID locally
      await updateShareId({ songId: song.id, shareId });
      await refetch();
      logEvent({ event: "shareSong", metadata: { shareId } });
      toast.info("Song uploaded successfully");
    } else {
      toast.error("Failed to upload song");
    }
  };

  return !song.shareId?.length ? (
    <Button
      variant={"contained"}
      onClick={() => processShare()}
      sx={{ backgroundColor: "#646464", borderRadius: "12px" }}
      endIcon={isUploading ? <CircularProgress variant="indeterminate" color="inherit" size={20} /> : <Link />}
    >
      {isUploading ? "Uploading..." : "Share"}
    </Button>
  ) : (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#646464",
        px: 0.75,
        py: 0.5,
        borderRadius: 2,
        gap: 1,
      }}
    >
      <Typography variant={"body1"}>{`${BASE_SHARE_URL}${song.shareId}`}</Typography>
      <IconButton
        sx={{ color: "white", backgroundColor: "#2c2c2c", borderRadius: 2 }}
        onClick={() => copyToClipboard(`https://${BASE_SHARE_URL}${song.shareId}`)}
        size="small"
      >
        <Link />
      </IconButton>
    </Box>
  );
};

export default ShareButton;
