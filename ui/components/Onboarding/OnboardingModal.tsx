import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Modal, stepLabelClasses } from "@mui/material";
import { useReplay } from "../../context";
import path from "path-browserify";
import { trpcReact } from "../../config/trpc";
import { ArrowForward } from "@mui/icons-material";
import theme from "../theme.ts";
import { useDevice, useModelDownloadStatus, useModelList } from "../../hooks/dataHooks.ts";

const steps = ["Add audio track", "Select artist", "Advanced", "System Requirements", "Create song"];
const SysReqStep = () => {
  const { data: device } = useDevice();
  return (
    <>
      <Box key={2} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2">
          {
            "Replay needs at least 8gb of RAM to run, but works best with more than 16gb. If you have less than 16gb, you can still use Replay, but you may experience crashes or poor performance."
          }
        </Typography>
        <Typography variant="body2">
          {
            "Replay also needs a GPU. If you don't have a GPU, you can still use Replay, but you'll need to use the CPU inference mode, which is much slower (~20x)."
          }
        </Typography>
        {device === "cpu" && (
          <Typography variant="body2" fontWeight={"bold"}>
            {
              "Unfortunately it looks like you have a CPU, which means that inference will be much slower. You can still use Replay, but your CPU will be at 100% while you create songs, and might freeze your computer while it runs."
            }
          </Typography>
        )}
        {device && ["mps", "cuda"].includes(device) && (
          <Typography variant="body2" fontWeight={"bold"}>
            {`Good news! It looks like your machine will run using ${device.toUpperCase()}, which is much faster than CPU.`}
          </Typography>
        )}
      </Box>
    </>
  );
};
const stepContent = [
  <Box key={0} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="body2">{"Welcome! Let's create your first song"}</Typography>
    <Typography variant="body2">
      {
        "To start, you'll select your audio source. These can be local audio files, a YouTube video, or a voice recording. Recording your own voice is especially useful for creating talking conversions instead of music."
      }
    </Typography>
    <Typography variant="body2">{"Click next, and we'll preload an example song for you."}</Typography>
  </Box>,
  <Box key={1} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="body2">
      {
        "Next, you'll need to select the artist you want to convert with. We've already put a few tested, high-quality models in your favorites, but you can download and favorite as many of the 4000+ models we have available."
      }
    </Typography>
    <Typography variant="body2">
      {"Just note, not all models have been tested. Model quality may vary, and some models may not work at all."}
    </Typography>
    <Typography variant="body2">{"Click next, and we'll select an example artist for you."}</Typography>
  </Box>,
  <Box key={2} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="body2">
      {
        "Default settings will give you the best chance of high-quality songs, but if you'd like to tune these, you can change them all in advanced settings."
      }
    </Typography>
    <Typography variant="body2">
      {
        "There you can select pitch conversion settings, track splitting methods, and even detailed inference settings. You can also upload your own models."
      }
    </Typography>
    <Typography variant="body2">
      {
        "These settings can drastically change the quality of your songs, so we recommend joining our Discord to learn more about how to use these."
      }
    </Typography>
  </Box>,
  <SysReqStep key={"sys-req"} />,
  <Box key={3} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <Typography variant="body2">{"That's all you need to know!"}</Typography>
    <Typography variant="body2">
      {
        "You can queue as many songs as you'd like, and view their progress in the bottom left. Once a song finishes, you'll see it show up in your library on the left."
      }
    </Typography>
  </Box>,
];

const DEFAULT_MODEL_ID = "kanye";

export default function OnboardingModal({ refetch }: { refetch: () => void }) {
  const [activeStep, setActiveStep] = useState(0);
  const selectSong = useReplay((state) => state.setSongUrlOrFilePath);
  const setModelId = useReplay((state) => state.setModelId);
  const { data: models, refetch: refetchModels } = useModelList();

  const { mutateAsync: downloadModel, isLoading: isDownloadingModel } = trpcReact.downloadSpecificModel.useMutation();
  const { mutateAsync: setHasCompletedOnboarding } = trpcReact.setHasCompletedOnboarding.useMutation();

  const model = models?.find((l) => l.id === DEFAULT_MODEL_ID);
  const { data: downloadStatus } = useModelDownloadStatus(model);
  const hasDownloaded = Boolean(model?.downloaded);

  const isFinalStep = activeStep === steps.length - 1;
  const handleNext = async () => {
    if (activeStep === 0) {
      selectSong(path.join(window.paths.RESOURCES_PATH, "assets", "WelcomeToReplay.mp3"));
    } else if (activeStep === 1) {
      setModelId(DEFAULT_MODEL_ID);
      if (!hasDownloaded && !isDownloadingModel) {
        downloadModel({ id: DEFAULT_MODEL_ID }).then(() => {
          refetchModels();
        });
      }
    } else if (isFinalStep) {
      await setHasCompletedOnboarding(true);
      refetch();
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleDismiss = async () => {
    await setHasCompletedOnboarding(true);
    refetch();
  };
  const getDownloadProgress = () => {
    const progress = downloadStatus?.progress;
    if (!progress || !progress?.loaded) {
      return "";
    }
    const fileByteCount = progress?.total || 1;
    const currentFileDownloadedBytes = progress?.loaded || 0;
    const currFilePercent = Math.round((currentFileDownloadedBytes * 100) / fileByteCount);
    return ` (${currFilePercent}%)`;
  };
  return (
    <Modal open={true} onClose={() => {}} aria-labelledby="modal-song-edit" aria-describedby="modal-edit_song-details">
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
        <Box sx={{ width: "100%" }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => {
              return (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      [`& .${stepLabelClasses.label}`]: {
                        [`&.${stepLabelClasses.completed}`]: {
                          color: "rgb(255, 255, 255, 0.3)",
                        },
                        [`&.${stepLabelClasses.active}`]: {
                          color: theme.colors.mayaBlue,
                        },

                        color: "rgb(255, 255, 255, 0.9)",
                      },
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>

          <Box sx={{ mt: 2, mb: 1 }}>{stepContent[activeStep]}</Box>
          <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
            <Button onClick={handleDismiss} sx={{ mr: 1, color: theme.colors.lightGray }}>
              Not now
            </Button>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1, borderRadius: 2, backgroundColor: "#646464" }}
              variant="contained"
            >
              Back
            </Button>
            <Box sx={{ flex: "1 1 auto" }} />
            <Button onClick={handleNext} variant="contained" sx={{ borderRadius: 2 }} endIcon={<ArrowForward />}>
              {isFinalStep ? (isDownloadingModel ? `Downloading model${getDownloadProgress()}` : "Finish") : "Next"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
