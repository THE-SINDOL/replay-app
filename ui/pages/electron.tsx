import React from "react";
import { ipcLink } from "electron-trpc/renderer";
import superjson from "superjson";
import { ContextProviders, ProvidedApp, queryClient } from "./_app";
import { trpcReact } from "../config/trpc";
import Box from "@mui/material/Box";
import { isProd } from "../config.ts";
import * as Sentry from "@sentry/electron/renderer";
import { init as reactInit } from "@sentry/react";

const trpcClient = trpcReact.createClient({
  links: [ipcLink()],
  transformer: superjson,
});

(async () => {
  if (isProd) {
    try {
      Sentry.init(
        {
          debug: false,
          attachStacktrace: true,
          autoSessionTracking: true,
          sendDefaultPii: true,
          integrations: [
            new Sentry.Replay({
              maskAllText: false,
              maskAllInputs: false,
            }),
          ],
          // This sets the sample rate to be 10%. You may want this to be 100% while
          // in development and sample at a lower rate in production
          replaysSessionSampleRate: 0.1,
          // If the entire session is not sampled, use the below sample rate to sample
          // sessions when an error occurs.
          replaysOnErrorSampleRate: 1.0,
        },
        reactInit,
      );
    } catch (e) {
      console.error(e);
    }
  }
})();
const TitleBar = () => {
  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      width={"100%"}
      height={"30px"}
      alignItems={"center"}
      alignContent={"center"}
      overflow={"hidden"}
      position={"fixed"}
      sx={{
        WebkitUserSelect: "none",
        WebkitAppRegion: "drag",
      }}
    />
  );
};

const SetDetails = () => {
  const { data: osDetails } = trpcReact.getOsDetails.useQuery();
  const { data: deviceId } = trpcReact.getDeviceId.useQuery();
  const { data: analyticsDisabled } = trpcReact.getAnalyticsDisabled.useQuery();
  React.useEffect(() => {
    try {
      const sentryClient = Sentry.getCurrentHub().getClient();
      if (sentryClient) {
        sentryClient.getOptions().enabled = !analyticsDisabled;
      }
      Sentry.setUser({ id: deviceId });
      Sentry.setTag("device_id", deviceId);
      if (osDetails) {
        const { hostname, homedir, totalmem, platform, arch, networkInterfaces, cpus, freemem } = osDetails;
        Sentry.setTag("arch", arch);
        Sentry.setTag("platform", platform);
        Sentry.setTag("totalmem", totalmem);
        Sentry.setTag("freemem", freemem);
        Sentry.setTag("hostname", hostname);
        Sentry.setTag("homedir", homedir);
        Sentry.setContext("networkInterfaces", networkInterfaces);
        if (cpus) {
          Sentry.setTag("cpuCount", cpus.length);
          Sentry.setContext("cpus", cpus);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [analyticsDisabled, deviceId, osDetails]);
  return null;
};
export default function App() {
  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <ContextProviders>
        <SetDetails />
        <TitleBar />
        <ProvidedApp />
      </ContextProviders>
    </trpcReact.Provider>
  );
}
