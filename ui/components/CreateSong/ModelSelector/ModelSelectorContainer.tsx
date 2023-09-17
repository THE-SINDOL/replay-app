import * as React from "react";
import Box from "@mui/material/Box";
import { useReplay } from "../../../context.tsx";
import { Cancel } from "@mui/icons-material";
import "react-contexify/ReactContexify.css";
import { IconButton } from "@mui/material";
import { ModelSelector } from "./ModelSelector.tsx";
import { ErrorBoundary } from "../../ErrorBoundary.tsx";
import { SelectedModel } from "./SelectedModel.tsx";
import { useSelectedModel } from "../../../hooks/dataHooks.ts";
import { ModelDropper } from "../ModelDropper.tsx";

export const ModelSelectorContainer = () => {
  const model = useSelectedModel();
  const setModelId = useReplay((state) => state.setModelId);
  const options = useReplay((state) => state.options);
  if (options.vocalsOnly) {
    return null;
  }

  return (
    <Box
      sx={{
        zIndex: 999,
        background: "#2c2c2c",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        width: "100%",
        justifyContent: "space-between",
        mt: 1,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "start", gap: 1, width: "100%" }}>
        <Box
          sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1, height: "100%", width: "100%" }}
        >
          <Box
            sx={{
              display: "flex",
              position: "relative",
              border: model ? "" : "2px solid #3c3c3c",
              backgroundColor: model ? "#3c3c3c" : "",
              flexDirection: "column",
              alignItems: model ? "start" : "center",
              justifyContent: "center",

              width: "100%",
              borderRadius: 3,
              minHeight: 80,
            }}
          >
            <ErrorBoundary>
              {model ? (
                <SelectedModel key={model.id} />
              ) : (
                <ErrorBoundary>
                  <ModelDropper />
                </ErrorBoundary>
              )}
              {/* Remove Model Button */}
              {model && (
                <Box sx={{ position: "absolute", top: 0, right: 0 }}>
                  <IconButton title={"Close"} onClick={() => setModelId(null)}>
                    <Cancel color="disabled" />
                  </IconButton>
                </Box>
              )}
            </ErrorBoundary>
          </Box>
        </Box>
        <ModelSelector />
      </Box>
    </Box>
  );
};
