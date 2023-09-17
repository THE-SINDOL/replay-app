import type { WritableOptions } from "stream";
import { Writable } from "stream";
import type { Logger } from "winston";

interface LogStreamWrapperOptions extends Exclude<WritableOptions, "write"> {
  /**
   * The level to log messages at.
   */
  level: string;

  /**
   * Whether to split the stream's input into separate log messages on newlines.
   * If `false`, every chunk of data will be logged as a single log message.
   * Defaults to `true`.
   */
  splitLines?: boolean;

  /**
   * Whether to skip empty lines when `splitLines` is `true`.
   * Defaults to `true`.
   */
  skipEmptyLines?: boolean;

  /**
   * The line separator to use when `splitLines` is `true`.
   * Defaults to `\n`.
   */
  lineSeparator?: string;
}

/**
 * A stream that writes to a winston logger.
 */
class LogStreamWrapper extends Writable {
  private logger: Logger;
  private level: string;
  private splitLines: boolean;
  private skipEmptyLines: boolean;
  private lineSeparator: string;

  constructor(
    logger: Logger,
    {
      level,
      splitLines = true,
      skipEmptyLines = true,
      lineSeparator = "\n",
      ...streamOptions
    }: LogStreamWrapperOptions,
  ) {
    super(streamOptions);

    this.logger = logger;

    // Config options
    this.level = level;
    this.splitLines = splitLines;
    this.skipEmptyLines = skipEmptyLines;
    this.lineSeparator = lineSeparator;
  }

  _write(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chunk: any,
    encoding: BufferEncoding | "buffer",
    callback: (error?: Error | null) => void,
  ) {
    const decoded: string = encoding !== "buffer" ? chunk.toString(encoding) : chunk.toString();

    if (!this.splitLines) {
      this.logger.log(this.level, decoded);
    } else {
      let messages = decoded.split(this.lineSeparator);

      if (this.skipEmptyLines) {
        messages = messages.filter((message) => message.length > 0);
      }

      for (const message of messages) {
        this.logger.log(this.level, message);
      }
    }

    callback();
  }
}

export default LogStreamWrapper;
