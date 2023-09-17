import React from "react";
import logoImage from "../../../assets/icon@2x.png";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { trpcReact } from "../../config/trpc.ts";

export interface LogoProps {
  size?: number;
}
export const Logo = ({ size = 200 }: LogoProps) => {
  return <img src={logoImage} alt={"Replay Logo"} width={size} height={size} />;
};

export const Wordmark = ({ showVersion }: { showVersion?: boolean }) => {
  const { data } = trpcReact.appVersion.useQuery();
  return (
    <Box display={"flex"} alignItems={"center"} flexDirection={"column"} sx={{ userSelect: "none" }}>
      <Typography variant={"h1"} sx={{ fontSize: 50, lineHeight: "normal", letterSpacing: "-4px" }}>
        Replay
      </Typography>
      {showVersion && data && (
        <Typography variant={"body2"} sx={{ fontSize: 10, lineHeight: "normal" }}>
          v{data}
        </Typography>
      )}
    </Box>
  );
};
