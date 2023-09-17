import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { trpcReact } from "../../config/trpc.ts";
import Button from "@mui/material/Button";
import { Folder } from "@mui/icons-material";
import { Switch } from "@mui/material";
import React from "react";

const DownloadDirectorySettings = () => {
  const { data: downloadDirectory, refetch } = trpcReact.getDownloadDirectory.useQuery();
  const { mutateAsync: setDownloadDirectory, isLoading: isSelectingDownloadDir } =
    trpcReact.setDownloadDirectory.useMutation();
  return (
    <Box sx={{ backgroundColor: "#2c2c2c", p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Typography variant={"h1"}>Download Location</Typography>
        <Box sx={{ display: "flex", ml: "auto" }}>
          <Button
            variant="contained"
            disabled={isSelectingDownloadDir}
            onClick={async () => {
              await setDownloadDirectory();
              await refetch();
            }}
            sx={{ backgroundColor: "#646464", borderRadius: 2 }}
            endIcon={<Folder />}
          >
            Select New
          </Button>
        </Box>
      </Box>
      <Box sx={{ backgroundColor: "#646464", px: 2, py: 1, borderRadius: 2 }}>
        <Typography variant={"body1"}>{downloadDirectory}</Typography>
      </Box>
    </Box>
  );
};

const AppDirectorySettings = () => {
  const { data, refetch } = trpcReact.getCurrentAppDir.useQuery();
  const { mutateAsync, isLoading } = trpcReact.selectNewAppDir.useMutation();
  return (
    <Box sx={{ backgroundColor: "#2c2c2c", p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Typography variant={"h1"}>Current App Directory</Typography>
        <Box sx={{ display: "flex", ml: "auto" }}>
          <Button
            variant="contained"
            disabled={isLoading}
            onClick={async () => {
              await mutateAsync();
              await refetch();
            }}
            sx={{ backgroundColor: "#646464", borderRadius: 2 }}
            endIcon={<Folder />}
          >
            Select New
          </Button>
        </Box>
      </Box>
      <Box sx={{ backgroundColor: "#646464", px: 2, py: 1, borderRadius: 2 }}>
        <Typography variant={"body1"}>{data}</Typography>
      </Box>
    </Box>
  );
};

const PinnedServerToggle = () => {
  const { data: canShowPinnedVersion } = trpcReact.canShowPinnedVersion.useQuery();
  const { data: configShouldUsePinnedVersion, refetch } = trpcReact.configShouldUsePinnedVersion.useQuery();
  const { mutateAsync: setConfigShouldUsePinnedVersion } = trpcReact.setConfigShouldUsePinnedVersion.useMutation();

  if (!canShowPinnedVersion) {
    return null;
  }
  return (
    <Box sx={{ backgroundColor: "#2c2c2c", p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Typography variant={"h1"}>Pin server version to UI version</Typography>
        <Box sx={{ display: "flex", ml: "auto" }}>
          <Switch
            checked={configShouldUsePinnedVersion ?? false}
            onChange={async (e) => {
              const usePinned = e.target.checked;
              await setConfigShouldUsePinnedVersion(usePinned);
              await refetch();
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

const AnalyticsToggle = () => {
  const { data: analyticsDisabled, refetch } = trpcReact.getAnalyticsDisabled.useQuery();
  const { mutateAsync } = trpcReact.setAnalyticsDisabled.useMutation();
  return (
    <Box sx={{ backgroundColor: "#2c2c2c", p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2 }}>
        <Box>
          <Typography variant={"h1"}>Disable Analytics</Typography>
          <Typography variant={"body2"} sx={{ fontStyle: "italic", fontSize: "10px", color: "#646464" }}>
            {"We use Sentry to collect anonymous crash reports and usage data"}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", ml: "auto" }}>
          <Switch
            checked={analyticsDisabled ?? false}
            onChange={async (e) => {
              const disabled = e.target.checked;
              await mutateAsync(disabled);
              await refetch();
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export const SettingsPage = () => {
  return (
    <Box sx={{ p: 2, m: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant={"h1"}>Settings</Typography>
      <DownloadDirectorySettings />
      <AppDirectorySettings />
      <PinnedServerToggle />
      <AnalyticsToggle />
    </Box>
  );
};
