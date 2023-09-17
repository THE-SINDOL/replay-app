import { z } from "zod";
import { procedure, router } from "../trpc";
import {
  getExistingShareId,
  flushUploadedSong,
  getSharedSongDetails,
  getPlaybackUrl,
  getUploadUrl,
  getDownloadPath,
  logAnalytics,
  PlatformType,
} from "../kv_utils";
export const isProd = process.env.NODE_ENV === "production";
export const webappRouter = router({
  getExistingShareId: procedure.input(z.string()).query((opts) => {
    return getExistingShareId(opts.input);
  }),
  getPlaybackUrl: procedure.input(z.string()).query((opts) => {
    return getPlaybackUrl(opts.input);
  }),
  getUploadUrl: procedure.input(z.string()).query((opts) => {
    return getUploadUrl(opts.input);
  }),
  flushUploadedSong: procedure
    .input(
      z.object({
        shareId: z.string(),
        metadata: z.any(),
      }),
    )
    .query((opts) => {
      return flushUploadedSong(opts.input.shareId, opts.input.metadata);
    }),
  getSharedSongDetails: procedure.input(z.string()).query((opts) => {
    return getSharedSongDetails(opts.input);
  }),
  getDownloadPath: procedure.input(z.nativeEnum(PlatformType)).query((opts) => {
    return getDownloadPath(opts.input);
  }),
  logAnalytics: procedure
    .input(z.object({ deviceId: z.string(), event: z.string(), metadata: z.any().or(z.null()) }))
    .query((opts) => {
      try {
        return logAnalytics(opts.input);
      } catch (e) {
        if (isProd) {
          console.error(e);
        }
        return null;
      }
    }),
});

// export type definition of API
export type WebappRouter = typeof webappRouter;
