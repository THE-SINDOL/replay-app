import { electronRouter } from "./routers/electron-router";
import { sharedRouter } from "./routers/shared-router";
import type { webappRouter } from "../webapp/server/routers/webapp-router";
import { t } from "./trpc";

export const router = t.mergeRouters(electronRouter, sharedRouter);

export type AppRouter = typeof router;
export type WebappRouter = typeof webappRouter;
