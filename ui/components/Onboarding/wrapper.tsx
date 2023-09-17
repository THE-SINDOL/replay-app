import React from "react";
import Box from "@mui/material/Box";

export const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box
      height={"100%"}
      sx={{
        display: "flex",
        flexGrow: 1,
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {children}
    </Box>
  );
};
