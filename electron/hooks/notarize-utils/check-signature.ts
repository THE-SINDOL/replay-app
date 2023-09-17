import * as path from "path";

import { spawn } from "./spawn";
import type { NotarizeStapleOptions } from "./types";

const codesignVerify = async (opts: NotarizeStapleOptions) => {
  const result = await spawn("codesign", ["-vvv", "--deep", "--strict", path.basename(opts.appPath)], {
    cwd: path.dirname(opts.appPath),
  });
  return result;
};

const codesignDisplay = async (opts: NotarizeStapleOptions) => {
  const result = await spawn("codesign", ["-dv", "-vvvv", "--deep", path.basename(opts.appPath)], {
    cwd: path.dirname(opts.appPath),
  });
  return result;
};
export async function checkSignatures(opts: NotarizeStapleOptions): Promise<void> {
  const codesignResult = await codesignVerify(opts);
  console.log(codesignResult.output);
  const displayResult = await codesignDisplay(opts);
  console.log(displayResult.output);

  let error = "";
  if (codesignResult.code !== 0) {
    error += `Failed to codesign your application with code: ${codesignResult.code}\n\n${codesignResult.output}\n`;
  }

  if (displayResult.code !== 0) {
    error += `Failed to display codesign info with code: ${displayResult.code}\n\n${displayResult.output}\n`;
  }

  if (error) {
    throw new Error(error);
  }
}
