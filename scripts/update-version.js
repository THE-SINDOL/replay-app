import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fsp from "fs/promises";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let newVersion = process.env.NEW_RELEASE_VERSION;
import dayjs from "dayjs";
if (!newVersion) {
  // if we dont have a new version, make the new version a timestamp
  const timestamp = dayjs().format("YYYYMMDDHHmmss");
  newVersion = `0.0.0-development-${timestamp}`;
}

const newlines = "\n".repeat(4);
console.log(`${newlines}Updating package.json to version ${newVersion}${newlines}`);
const packagePath = path.join(__dirname, "..", "package.json");
const packageJson = await fsp.readFile(packagePath, "utf-8");
const packageObject = JSON.parse(packageJson);
const isDevBuild = newVersion.includes("development") || process.env.DEV_FASTBUILD === "true";
if (isDevBuild) {
  console.log("Is dev, changing release url");
  packageObject.build.win.publish.bucket = "replay-updates-dev";
  packageObject.build.linux.publish.bucket = "replay-updates-dev";
  packageObject.build.mac.publish.bucket = "replay-updates-dev";
}
packageObject.version = newVersion;
await fsp.writeFile(packagePath, JSON.stringify(packageObject, null, 4), "utf-8");
