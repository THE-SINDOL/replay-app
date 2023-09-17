import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import * as esbuild from "esbuild";

const input = path.join(__dirname, "server.ts");
const output = path.join(__dirname, "dist", "server.js");
await esbuild.build({
  entryPoints: [input],
  bundle: true,
  outfile: output,
  minify: false,
  treeShaking: true,
  target: "node19",
  format: "cjs",
  platform: "node",
  external: ["@replay/electron"],
});
