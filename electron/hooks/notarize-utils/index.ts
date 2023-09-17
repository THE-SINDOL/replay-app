import debug from "debug";
import retry from "promise-retry";

import { isNotaryToolAvailable, notarizeAndWaitForNotaryTool } from "./notarytool";
import { stapleApp } from "./staple";
import type { NotaryToolStartOptions } from "./types";
import type { NotarizeOptions } from "./types";
import { checkSignatures } from "./check-signature";

const d = debug("electron-notarize");

export type { NotarizeOptions };

export { validateLegacyAuthorizationArgs as validateAuthorizationArgs } from "./validate-args";

export async function notarize({ appPath, ...otherOptions }: NotarizeOptions) {
  d("notarizing using the new notarytool system");
  if (!(await isNotaryToolAvailable())) {
    throw new Error("notarytool is not available, you must be on at least Xcode 13");
  }

  await notarizeAndWaitForNotaryTool({
    appPath,
    ...otherOptions,
  } as NotaryToolStartOptions);

  await checkSignatures({ appPath });
  await retry(() => stapleApp({ appPath }), {
    retries: 3,
  });
}
