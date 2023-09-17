import type { AppRouter, WebappRouter } from "@replay/api/api";
import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { isProd } from "../config.ts";

export const trpcReact = createTRPCReact<AppRouter>();

export const trpcWeb = createTRPCProxyClient<WebappRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: isProd ? "https://www.tryreplay.io/api/trpc" : "http://localhost:3000/api/trpc",
    }),
  ],
});
