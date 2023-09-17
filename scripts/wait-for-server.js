import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = path.join(__dirname, "..", "python", "dist");
const THIRTY_MIN_MS = 30 * 60 * 1000;
const serverExists = async () => {
  try {
    const files = await fs.promises.readdir(distPath);
    const serverFile = files.find((f) => f.startsWith("server"));
    return Boolean(serverFile);
  } catch (e) {
    return false;
  }
};
const serverExistsPromise = (async () => {
  while (true) {
    if (await serverExists()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
})();
const start = new Date();
console.log("Waiting for server to be built...");
const timeout = new Promise((resolve) => setTimeout(resolve, THIRTY_MIN_MS));
await Promise.race([timeout, serverExistsPromise]);
// try and access it so it throws if not
const exists = await serverExists();
if (!exists) {
  throw new Error("Server did not build in 30 minutes.");
}
const msElapsed = new Date() - start;
console.log(`Server started in ${msElapsed / 1000}s.`);
process.exit(0);
