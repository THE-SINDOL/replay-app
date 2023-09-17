import { useEffect } from "react";
import { toast } from "react-toastify";
import { trpcReact } from "../../config/trpc";
import { Box, IconButton, Typography } from "@mui/material";
import { startCase } from "lodash-es";
import type { Job } from "@replay/shared/clients/type-utils";
import { Cancel } from "@mui/icons-material";

// super hacky way of making sure we only toast once for each jobid/status combo lol
const toastedIds = new Set<string>();
export default function JobItem({
  cancelJob,
  job,
  jobNum,
}: {
  cancelJob: (jobId: string) => void;
  job: Job;
  jobNum: number;
}) {
  const { mutateAsync: saveCompletedSong } = trpcReact.saveCompletedSong.useMutation();
  const { refetch: refetchSongList, data: songList } = trpcReact.createdSongList.useQuery();
  const jobId = job.jobId;
  const error = job.error;
  const savedSong = songList?.find((song) => song.jobId === jobId);

  const status = job.status;
  const title = `${startCase(job.modelId || "")} • ${startCase(job.trackName || "")}`;

  useEffect(() => {
    (async () => {
      const toastOptions = { toastId: `${jobId}-${status}-toast` };
      if (
        jobId &&
        ["completed", "errored", "stopped"].includes(status) &&
        (!savedSong || savedSong.status !== status)
      ) {
        if (!toastedIds.has(toastOptions.toastId)) {
          if (status === "completed") {
            toast.info("Song created successfully!", toastOptions);
            toastedIds.add(toastOptions.toastId);
          } else if (status === "errored") {
            toast.error(`Error creating song: ${error}`, toastOptions);
            toastedIds.add(toastOptions.toastId);
          } else if (status === "stopped") {
            toast.error("Song cancelled", toastOptions);
            toastedIds.add(toastOptions.toastId);
          }
        }
        // Update regardless of status
        if (status === "completed") {
          const didSucceedInSaving = await saveCompletedSong(jobId);
          if (!didSucceedInSaving) {
            toast.warning("Failed to save song to database, this should not occur");
          }
          await refetchSongList();
        }
      }
    })();
  }, [error, status, saveCompletedSong, refetchSongList, savedSong, jobId]);

  if (!jobId) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "center", width: "100%" }}>
      <Box
        sx={{
          backgroundColor: "#2c2c2c",
          px: 1,
          py: 0.5,
          borderRadius: 2,
          minWidth: 24,
        }}
      >
        <Typography>{jobNum}</Typography>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
        {job.modelId && (
          <Typography
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: "1",
              WebkitBoxOrient: "vertical",
              fontSize: "12px",
            }}
          >
            {title}
          </Typography>
        )}
        <Typography sx={{ fontSize: "10px", color: "#646464" }}>{startCase(status)}</Typography>
        {error && <Typography sx={{ fontSize: "10px", color: "red" }}>{startCase(error)}</Typography>}
      </Box>

      {status !== "processing" && (
        <IconButton onClick={() => cancelJob(jobId)}>
          <Cancel color="disabled" />
        </IconButton>
      )}
    </Box>
  );
}
