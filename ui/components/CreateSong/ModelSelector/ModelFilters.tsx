import { useReplay } from "../../../context.tsx";
import { FAVORITES_CATEGORY, useVoiceModelCategories } from "../../../hooks/categories.ts";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import theme from "../../theme.ts";
import { startCase } from "lodash-es";
import * as React from "react";
import { ModelWrapper } from "./shared.tsx";

export const ModelFilters = () => {
  const setVoiceModelFilters = useReplay((state) => state.setVoiceModelFilters);
  const voiceModelFilters = useReplay((state) => state.voiceModelFilters);
  const { data: classifications } = useVoiceModelCategories();

  return (
    <ModelWrapper sx={{ height: "100%", width: 300, mr: 1 }}>
      <Box
        sx={{
          width: "100%",
          mx: 1,
          px: 1,
          mb: 0.5,
          maxHeight: 30,
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
          // background: "#2c2c2c",
          display: "flex",
          borderRadius: "5px",
          color: "white",
        }}
      >
        <Typography>Category</Typography>
      </Box>
      {classifications?.map((classification) => {
        const isFav = classification === FAVORITES_CATEGORY;
        const prefix = isFav ? "⭐️" : "";
        return (
          <Box
            sx={{
              borderRadius: 1,
              backgroundColor:
                classification === voiceModelFilters.classification ? theme.palette.primary.main : "#444444",
              py: 1,
              px: 1.5,
              my: 0.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              cursor: "pointer",
              mb: isFav ? 3 : 0,
            }}
            key={classification}
            onClick={() => {
              setVoiceModelFilters({ ...voiceModelFilters, classification });
            }}
          >
            {prefix} {startCase(classification)}
          </Box>
        );
      })}
    </ModelWrapper>
  );
};
