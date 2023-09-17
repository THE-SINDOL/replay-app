import React, { useEffect, useState } from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import { Welcome } from "./welcome";
import { FetchServerAndModelData } from "./model";
import { trpcReact } from "../../config/trpc.ts";
export interface SharedProps {
  onNext: () => void;
}

export const Onboarding = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const { data: hasCompletedOnboarding } = trpcReact.hasCompletedOnboarding.useQuery(undefined);
  useEffect(() => {
    if (hasCompletedOnboarding && currentPage === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, hasCompletedOnboarding]);

  const render = () => {
    switch (currentPage) {
      case 0:
        return <Welcome onNext={() => setCurrentPage(1)} />;
      case 1:
        return <FetchServerAndModelData onNext={() => setCurrentPage(2)} />;
    }
  };
  return (
    <Backdrop open={true} sx={{ WebkitUserSelect: "none", WebkitAppRegion: "drag" }}>
      <Box
        sx={{
          background: "#2c2c2c",
          m: 2,
          px: 3,
          py: 4,
          maxWidth: 500,
          minHeight: 500,
          minWidth: 500,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 999,
          borderRadius: 8,
          WebkitUserDrag: "none",
          WebkitUserSelect: "initial",
          WebkitAppRegion: "no-drag",
        }}
      >
        {render()}
      </Box>
    </Backdrop>
  );
};
