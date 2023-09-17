import type { LeveledLogMethod, LoggerOptions } from "winston";
import fs from "fs";
import winston from "winston";
import path from "path";
import os from "os";
import packageJson from "../package.json";
const appId = packageJson.build.appId;

const { combine, timestamp, printf, colorize, errors, splat } = winston.format;
export const winstonTimestamp = timestamp({
  format: "YYYY-MM-DD HH:mm:ss",
});
const winstonPrint = (prefix: string = "") =>
  printf((info) => {
    if (typeof info.message === "object") {
      info.message = JSON.stringify(info.message);
    }
    return (
      `${prefix}[${info.timestamp}] [${info.level}] - ${info.message}` +
      (info.splat !== undefined ? `${info.splat}` : " ") +
      (info.stack !== undefined ? `\n${info.stack}` : " ")
    );
  });

export const localFormat = (prefix = "") =>
  combine(winstonTimestamp, colorize(), splat(), errors({ stack: true }), winstonPrint(prefix));
export const fileLogFormat = (prefix = "") =>
  combine(winstonTimestamp, splat(), errors({ stack: true }), winstonPrint(prefix));

const isElectron = Boolean(process.env.ELECTRON);

export const logDateTime = new Date().toISOString().replaceAll(":", ".");
export const logDir = isElectron
  ? // electron hack, this shouldn't use require but we use it so we can require this file from the main process
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    path.join(require("electron").app.getPath("logs"), logDateTime)
  : path.join(os.homedir(), "Library", "Logs", appId, logDateTime);

export const logPath = path.join(logDir, `replay.log`);
export const uiLogPath = path.join(logDir, `replay-ui.log`);
export const pythonServiceLogPath = path.join(logDir, `replay-pythonservice.log`);

// ensure directory exists recursively
if (isElectron && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const getLogger = (path: string, prefix = "", patchError: boolean = true) => {
  const console = new winston.transports.Console({
    format: localFormat(prefix),
  });
  const transports: LoggerOptions["transports"] = [console];

  if (isElectron) {
    transports.push(
      new winston.transports.File({
        filename: path,
        format: fileLogFormat(prefix),
      }),
    );
  }

  const logger = winston.createLogger({
    level: "debug",
    transports,
  });
  if (patchError) {
    const oldError = logger.error;
    logger.error = ((...args) => {
      let err = args[0] || {};
      if (!(err instanceof Error)) {
        const stack = new Error().stack;
        if (typeof err === "string") {
          err = { message: err, stack };
        } else {
          // todo deal with arrays?
          err.stack = stack;
        }
      }

      if (!err.message) {
        err.message = "Unknown error";
      }
      args[0] = JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err)));

      // @ts-ignore
      return oldError(...args);
    }) as LeveledLogMethod;
  }
  return logger;
};

export const logger = getLogger(logPath);
export const uiLogger = getLogger(uiLogPath, "[Renderer]", false);
export const serverLogger = getLogger(pythonServiceLogPath, "[Server]");

export default logger;
