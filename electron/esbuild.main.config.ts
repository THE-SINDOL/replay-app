import type { BuildOptions } from "esbuild";
import * as path from "path";
import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin";

const isProd = process.env.NODE_ENV === "production";
const config: BuildOptions = {
  platform: "node",
  entryPoints: [path.resolve("electron/index.ts"), path.resolve("electron/utils/preload.ts")],
  bundle: true,
  external: ["electron"],
  minify: false,
  minifyWhitespace: false,
  minifyIdentifiers: false,
  minifySyntax: false,
  treeShaking: isProd,
  keepNames: !isProd,
  target: "node19.9.0",
  sourcemap: "linked",
  define: {
    "process.env.ELECTRON": "true",
    "process.platform": `"${process.platform}"`,
    "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
    "process.env.APP_ENV": `"${process.env.APP_ENV}"`,
    "process.env.GITHUB_SHA": `"${process.env.GITHUB_SHA || ""}"`,
    "process.env.FLUENTFFMPEG_COV": "false",
  },
  plugins: isProd
    ? [
        // Put the Sentry esbuild plugin after all other plugins
        sentryEsbuildPlugin({
          org: "replay-29",
          project: "electron",

          // Auth tokens can be obtained from https://sentry.io/settings/account/api/auth-tokens/
          // and need `project:releases` and `org:read` scopes
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
      ]
    : [],
};

export default config;
