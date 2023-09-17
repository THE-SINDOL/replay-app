import { useCallback } from "react";
import { trpcReact, trpcWeb } from "../config/trpc";
import { isProd } from "../config.ts";

interface AnalyticsEvent {
  event:
    | "artistFavorite"
    | "pageView"
    | "stemModelDownload"
    | "audioSelected"
    | "audioDownload"
    | "modelDownload"
    | "modelSelect"
    | "shareSong"
    | "createSong"
    | "playSong";
  metadata?: object;
}

export const useAnalytics = () => {
  const { data: analyticsDisabled } = trpcReact.getAnalyticsDisabled.useQuery();
  const logEvent = useCallback(
    (eventData: AnalyticsEvent) => {
      if (!isProd || analyticsDisabled) {
        return;
      }
      try {
        trpcWeb.logAnalytics.query({ deviceId: window.config.deviceId, ...eventData });
      } catch (e) {
        if (isProd) {
          console.error(`Failed to log analytics: ${e}`);
        }
      }
    },
    [analyticsDisabled],
  );

  return logEvent;
};
