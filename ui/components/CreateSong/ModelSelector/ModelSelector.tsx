import * as React from "react";
import Box from "@mui/material/Box";
import { ModelFilters } from "./ModelFilters.tsx";
import { ModelList } from "./ModelList.tsx";

export const ModelSelector = () => {
  return (
    <Box sx={{ backgroundColor: "#2c2c2c", borderRadius: 1, display: "flex", width: "100%" }}>
      <ModelFilters />
      <ModelList />
    </Box>
  );
};
