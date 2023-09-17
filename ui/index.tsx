import React from "react";
import { createRoot } from "react-dom/client";
import { isElectron, isProd } from "./config.ts";
import posthog from "posthog-js";

if (isProd) {
  try {
    posthog.init("phc_bwdBlfmbDGSgWS6nDNGR3JZZ4ljvmTPHHRlzawRfatL", {
      api_host: "https://app.posthog.com",
      cross_subdomain_cookie: false,
      enable_recording_console_log: true,
      persistence: "localStorage",
      loaded(posthog) {
        if (window.config.deviceId) {
          posthog.identify(window.config.deviceId);
        }
      },
    });
  } catch (e) {
    // dont log anything on failure
  }
}

(async () => {
  let ProvidedApp: React.ElementType;
  if (isElectron) {
    ProvidedApp = (await import("./pages/electron")).default;
  } else {
    ProvidedApp = (await import("./pages/web")).default;
  }
  const root = createRoot(document.getElementById("root")!);

  root.render(<ProvidedApp />);
})();
