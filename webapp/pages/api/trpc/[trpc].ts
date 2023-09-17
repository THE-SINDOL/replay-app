import * as trpcNext from "@trpc/server/adapters/next";
import { webappRouter } from "../../../server/routers/webapp-router";

// export API handler
// @see https://trpc.io/docs/server/adapters
export default trpcNext.createNextApiHandler({
  router: webappRouter,
  createContext: () => ({}),
});
