import { Wrapper } from "./wrapper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import React from "react";
import type { SharedProps } from "./onboarding";
import { Logo, Wordmark } from "../Logo/Logo";
import { ArrowForward } from "@mui/icons-material";

export const Welcome = (props: SharedProps) => {
  return (
    <Wrapper>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant={"h1"}>{"Welcome to "}</Typography>
          <Wordmark />
        </Box>
        <Typography variant={"body1"} sx={{ pb: 1 }}>
          {"Let's get started remixing with AI"}
        </Typography>
      </Box>
      <Logo />
      <Box>
        <Button
          sx={{ mx: 2, backgroundColor: "#646464", borderRadius: 2 }}
          onClick={props.onNext}
          variant={"contained"}
          endIcon={<ArrowForward />}
        >
          Continue
        </Button>
      </Box>
    </Wrapper>
  );
};
