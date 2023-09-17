import "../styles";
import React, { useEffect, useRef } from "react";
import { styled, ThemeProvider } from "@mui/material/styles";
import { CacheProvider } from "@emotion/react";
import createEmotionCache from "../config/emotionCache";
import theme from "../components/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { isElectron, isProd } from "../config";
import { KeyPress } from "../utils/KeyPress";
import { toast } from "react-toastify";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);
dayjs.extend(relativeTime);
import { ToastContainer } from "react-toastify";

import { useHasRequiredFileComprehensive, useHasRequiredLocalFiles, useIsServerRunning } from "../hooks/dataHooks";
import { Onboarding } from "../components/Onboarding/onboarding";
import { QueryCache } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import { SongList } from "../components/SongList/SongList";
import { CreateSong } from "../components/CreateSong/CreateSong";
import { useReplay } from "../context";
import { SelectedPlaybackSong } from "../components/Playback/SelectedPlaybackSong";
import { trpcReact } from "../config/trpc";
import JobQueueDisplay from "../components/JobQueue/JobQueueDisplay";
import { useAnalytics } from "../hooks/useAnalytics";
import { SettingsPage } from "../components/Settings/SettingsPage";
import { CircularProgress } from "@mui/material";

export const queryCache = new QueryCache({
  onError: (err, query) => {
    if (err) {
      if (typeof err === "object" && "message" in err) {
        toast.error(`[${query["queryKey"][0]}]: ${err.message as string}`);
      } else if (typeof err === "string") {
        toast.error(`[${query["queryKey"][0]}]: ${err}`);
      }
    }
  },
});
const Container = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  user-select: ${() => (isProd ? "none" : "auto")};
`;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: Infinity,
      networkMode: "always",
      refetchIntervalInBackground: true,
    },
    mutations: {
      networkMode: "always",
    },
  },
  queryCache,
});

window.addEventListener("clear-cache", () => {
  console.log("Clearing cache");
  queryClient.clear();
});

const clientSideEmotionCache = createEmotionCache();
const toastId = "server-starting-toast";
const ServerStartupNotifications = () => {
  const isServerRunning = useIsServerRunning();
  const { data: pythonServiceStatus } = trpcReact.serverProcessStatus.useQuery(undefined, {
    refetchInterval: 1000,
  });
  useEffect(() => {
    // if the server is running then we're definitely good
    if (isServerRunning) {
      toast.dismiss(toastId);
      toast.done(toastId);
      return;
    }
    if (isServerRunning === undefined || !pythonServiceStatus) {
      return;
    }
    const status = pythonServiceStatus || "Unknown server status...";
    if (status.startsWith("Starting server")) {
      toast.info(status, { toastId, autoClose: false, closeOnClick: false, closeButton: false });
    } else {
      console.log(status);
      toast.error(status, { toastId, autoClose: false, closeOnClick: false, closeButton: false });
    }
  }, [pythonServiceStatus, isServerRunning]);
  return null;
};

const Content = () => {
  const selectedPlaybackSongId = useReplay((state) => state.selectedPlaybackSongId);
  const logEvent = useAnalytics();
  const prevSelectedPlaybackSongId = useRef(selectedPlaybackSongId);

  useEffect(() => {
    if (selectedPlaybackSongId !== prevSelectedPlaybackSongId.current) {
      logEvent({
        event: "pageView",
        metadata: { pageType: selectedPlaybackSongId ? "playbackPage" : "createPage" },
      });
    }

    // After comparing, update the previous value
    prevSelectedPlaybackSongId.current = selectedPlaybackSongId;
  }, [selectedPlaybackSongId, logEvent]);

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      width={"100%"}
      height={"100%"}
      alignItems={"center"}
      alignContent={"center"}
      overflow={"hidden"}
    >
      <Box
        display={"flex"}
        flexDirection={"row"}
        width={"100%"}
        height={"100%"}
        sx={{ background: "none", borderRadius: 1 }}
      >
        {isElectron && <ServerStartupNotifications />}
        <SongList />
        {selectedPlaybackSongId ? <SelectedPlaybackSong /> : <CreateSong />}
        <JobQueueDisplay />
      </Box>
    </Box>
  );
};
const isSettings = window.location.href.includes("?settings=true") || window.config?.isSettings;
export const ReplayApp = () => {
  const { data: hasLocalModel, isLoading } = useHasRequiredLocalFiles();
  const { data: hasLocalModelDefinitive } = useHasRequiredFileComprehensive();
  const { mutateAsync } = trpcReact.startServer.useMutation();
  const isServerRunning = useIsServerRunning();

  const showOnboarding = hasLocalModel === false || hasLocalModelDefinitive === false;
  React.useEffect(() => {
    if (!isServerRunning && hasLocalModel === true && hasLocalModelDefinitive === true && isProd) {
      mutateAsync();
    }
  }, [hasLocalModel, hasLocalModelDefinitive, isServerRunning, mutateAsync]);
  const getContent = () => {
    if (isSettings) {
      return <SettingsPage />;
    }
    if (isLoading) {
      return (
        <Box sx={{ margin: "auto", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CircularProgress />
        </Box>
      );
    }
    if (showOnboarding) {
      return <Onboarding />;
    }

    return <Content />;
  };
  return <Container>{getContent()}</Container>;
};
export const ReplayWebApp = () => {
  return <Container>{isSettings ? <SettingsPage /> : <Content />}</Container>;
};

export const ContextProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools position="bottom-right" />
          {!isProd && <ReactQueryDevtools position="bottom-right" />}
          {children}
          <ToastContainer position="top-right" theme="dark" />
        </QueryClientProvider>
      </ThemeProvider>
    </CacheProvider>
  );
};
export const ProvidedApp = () => {
  useEffect(() => {
    KeyPress.init();
    return () => {
      KeyPress.cleanup();
    };
  }, []);

  const App = isElectron ? ReplayApp : ReplayWebApp;
  return <App />;
};
