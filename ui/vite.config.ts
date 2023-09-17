import type { PluginOption } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

const isProduction = process.env.NODE_ENV === "production";
const plugins: PluginOption[] = [react()];
if (isProduction) {
  plugins.push(
    sentryVitePlugin({
      org: "replay-29",
      project: "electron",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  );
}
export default defineConfig({
  plugins: plugins.filter(Boolean),
  build: {
    target: "chrome116",
    minify: isProduction,
    sourcemap: true,
    ssr: false,
  },
  server: {
    port: 9080,
  },
  define: {
    "process.env": process.env,
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  esbuild: {
    minifyIdentifiers: isProduction,
    minifySyntax: isProduction,
    minifyWhitespace: isProduction,
    keepNames: !isProduction,
  },
});
