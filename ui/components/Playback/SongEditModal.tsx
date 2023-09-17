import { Box, Button, Modal, TextField, Typography } from "@mui/material";
import React from "react";
import { trpcReact } from "../../config/trpc";
import { useReplay } from "../../context";
import { getSongName } from "../SongList/SongEntry";
import type { SavedSong } from "@replay/electron/data/db-types.ts";

const SongEditModal = ({ song, onClose }: { song: SavedSong; onClose: () => void }) => {
  const { mutateAsync } = trpcReact.updateSongName.useMutation();
  const selectedPlaybackSongId = useReplay((state) => state.selectedPlaybackSongId);
  const { refetch: refetchSongList } = trpcReact.createdSongList.useQuery();
  const { refetch: refetchSongDetails } = trpcReact.getSong.useQuery(selectedPlaybackSongId || "");

  const name = getSongName(song);
  const [updatedName, setUpdatedName] = React.useState(name);

  const handleEditName = async () => {
    await mutateAsync({ songId: song.id, name: updatedName });
    await refetchSongDetails();
    await refetchSongList();
    onClose();
  };

  return (
    <Modal open={true} onClose={onClose} aria-labelledby="modal-song-edit" aria-describedby="modal-edit_song-details">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: 650,
          bgcolor: "#3c3c3c",
          borderRadius: "12px",
          boxShadow: 24,
          px: 4,
          py: 2,
          gap: 4,
          color: "black",
        }}
      >
        <Typography id="modal-edit-title" variant="h2" component="h1">
          Edit Song Details
        </Typography>
        <TextField
          label="Song name"
          size="small"
          onChange={(event) => setUpdatedName(event.target.value)}
          value={updatedName}
          color="info"
        />
        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 1 }}>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => handleEditName()} disabled={!updatedName}>
            Save
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SongEditModal;
