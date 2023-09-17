import { Box, IconButton, LinearProgress, Typography } from "@mui/material";
import { SONG_LIST_WIDTH } from "../SongList/SongList";
import { Cancel, ExpandLess, ExpandMore } from "@mui/icons-material";
import { useState } from "react";
import { useJobs } from "../../hooks/dataHooks";
import JobItem from "./JobItem";
import theme from "../theme.ts";
import { trpcReact } from "../../config/trpc.ts";
import { toast } from "react-toastify";

export const COLLAPSED_HEIGHT = 48;
const PROGRESS_HEIGHT = 120;
const EXPANDED_HEIGHT = 240;

export default function JobQueueDisplay() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: jobs = [], refetch: refetchJobs } = useJobs();
  const { mutateAsync: stopJob } = trpcReact.stopJob.useMutation();
  const { mutateAsync: removeJobFromQueue } = trpcReact.clearJob.useMutation();

  const queuedJobs = jobs.filter((job) => job.status === "queued");
  const processingJobs = jobs.filter((job) => job.status === "processing");
  const erroredJobs = jobs.filter((job) => job.status === "errored");
  const runningJobCount = processingJobs.length + queuedJobs.length;
  const { elapsedSeconds, remainingSeconds } = processingJobs[0] || { elapsedSeconds: 0, remainingSeconds: 0 };
  let normalizedProgress = 0.0;
  let normalizedTotal = 0.0;
  if (!!remainingSeconds && !!elapsedSeconds) {
    const normalizationConstant = 100.0 / (remainingSeconds + elapsedSeconds);
    normalizedProgress = Math.round(elapsedSeconds * normalizationConstant);
    normalizedTotal = Math.round((remainingSeconds + elapsedSeconds) * normalizationConstant);
  }
  const isProcessing = runningJobCount > 0;
  const hasError = erroredJobs.length > 0;
  const firstProcessingJob = processingJobs[0];
  const height = isProcessing ? PROGRESS_HEIGHT : COLLAPSED_HEIGHT;

  const clearJob = async (jobId: string) => {
    if (!jobId || !jobId.length) {
      return;
    }
    await removeJobFromQueue(jobId);
    toast.warning("Job cancelled.");
    refetchJobs();
  };

  const cancelJob = async (jobId: string) => {
    if (!jobId || !jobId.length) {
      return;
    }
    try {
      toast.warning("Cancelling job. Will terminate after current step.", { toastId: jobId });
      await stopJob(jobId);
      toast.warning("Job cancelled. Will terminate after current step.", { toastId: jobId });
    } catch (e) {
      console.log(e);
      toast.error(`Failed to cancel job: ${e}`, { toastId: jobId });
    }
  };

  const headerCopy = () => {
    if (runningJobCount) {
      return `${runningJobCount} Song${runningJobCount > 1 ? "s" : ""} Queued`;
    }
    if (erroredJobs.length) {
      return `${erroredJobs.length} Job${erroredJobs.length > 1 ? "s" : ""} Errored`;
    }
    return "No Jobs Running";
  };
  return (
    <Box
      sx={{
        width: SONG_LIST_WIDTH - 16,
        marginLeft: 1,
        minHeight: isExpanded ? EXPANDED_HEIGHT : height,
        position: "fixed",
        bottom: 0,
        left: 0,
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: 2,
        py: 1,
        transition: "height 0.2s ease-in-out",
        zIndex: 99,
        justifyContent: "space-between",
      }}
    >
      {/* Heading */}
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", width: "100%" }}>
        <Typography variant="body2">{headerCopy()}</Typography>
        <Box sx={{ ml: "auto" }}>
          <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ExpandMore color="disabled" /> : <ExpandLess color="disabled" />}
          </IconButton>
        </Box>
      </Box>
      {/* Job Detail List */}

      <Box
        sx={{
          display: isExpanded ? "flex" : "none",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          overflowY: "auto",
          gap: 0.5,
          justifySelf: "flex-start",
        }}
      >
        {jobs.map((job, index) => (
          <JobItem key={job.jobId} cancelJob={clearJob} job={job} jobNum={index + 1} />
        ))}
      </Box>

      {/* Inline Progress */}
      {(isProcessing || hasError) && (
        <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
          {firstProcessingJob?.message && (
            <Typography sx={{ my: 1, alignSelf: "center", wordBreak: "break-all" }} variant={"body2"}>
              {firstProcessingJob.message}
            </Typography>
          )}
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, width: "100%" }}>
            <Box sx={{ width: "100%" }}>
              {!isProcessing && hasError ? (
                <LinearProgress
                  sx={{
                    height: "12px",
                    borderRadius: "4px",
                  }}
                  color={"error"}
                  variant={"determinate"}
                  value={100}
                />
              ) : (
                <LinearProgress
                  sx={{
                    height: "12px",
                    borderRadius: "4px",
                  }}
                  variant={normalizedProgress ? "buffer" : "indeterminate"}
                  value={normalizedProgress}
                  valueBuffer={normalizedTotal}
                />
              )}
            </Box>
            <IconButton onClick={() => cancelJob(firstProcessingJob.jobId || "")}>
              <Cancel color="disabled" />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}
