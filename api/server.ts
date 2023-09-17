import { createHTTPServer } from "@trpc/server/adapters/standalone";
import cors from "cors";
import { router } from "./api";

const server = createHTTPServer({
  middleware: cors(),
  router,
});
const port = 52828;
server.server.on("listening", () => {
  console.log(`Server listening on ${port}`);
});

server.listen(port);
