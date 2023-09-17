import React from "react";
import superjson from "superjson";
import { ContextProviders, ProvidedApp, queryClient } from "./_app";
import { trpcReact } from "../config/trpc";
import { httpBatchLink } from "@trpc/client";
const isDev = process.env.NODE_ENV === "development";

const trpcClient = trpcReact.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: isDev ? "http://localhost:52828/trpc" : "https://tryreplay.io/api/trpc",
    }),
  ],
});

export default function App() {
  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <ContextProviders>
        <ProvidedApp />
      </ContextProviders>
    </trpcReact.Provider>
  );
}
