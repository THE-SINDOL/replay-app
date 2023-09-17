import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import * as esbuild from "esbuild";
const hooks = path.join(__dirname, "../electron/hooks");
const input = path.join(hooks, "notarize.ts");
const output = path.join(hooks, "notarize.js");
await esbuild.build({
  entryPoints: [input],
  bundle: true,
  outfile: output,
  minify: false,
  treeShaking: true,
  target: "node19",
  format: "cjs",
  platform: "node",
});
