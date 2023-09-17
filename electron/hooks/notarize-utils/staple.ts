import debug from "debug";
import * as path from "path";

import { spawn } from "./spawn";
import type { NotarizeStapleOptions } from "./types";

const d = debug("electron-notarize:staple");

export async function stapleApp(opts: NotarizeStapleOptions): Promise<void> {
  d("attempting to staple app:", opts.appPath);
  const result = await spawn("xcrun", ["stapler", "staple", path.basename(opts.appPath)], {
    cwd: path.dirname(opts.appPath),
  });

  if (result.code !== 0) {
    throw new Error(`Failed to staple your application with code: ${result.code}\n\n${result.output}`);
  }

  d("staple succeeded");
  return;
}
