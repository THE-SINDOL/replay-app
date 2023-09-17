/*
 * Copyright (c) 2022 Kiyozz.
 *
 * All rights reserved.
 */

import type { TypeConfig } from "./config/enums.mts";
import { track } from "./track.mts";

export function unsupportedType(type: TypeConfig, env?: "main" | "renderer"): never {
  const args = [track(), "unsupported type", type];

  if (env) {
    args.push("for", env);
  }

  console.error(...args);
  process.exit(1);
}

export class Logger {
  constructor(private namespace: string) {}

  log(...args: unknown[]): void {
    console.log(track(), `(${this.namespace})`, ...args);
  }

  debug(...args: unknown[]): void {
    if ((process.env.DEBUG ?? "").trim() !== "") {
      console.log(track(), `(${this.namespace})`, ...args, "[DEBUG]");
    }
  }

  error(...args: unknown[]): void {
    console.error(track(), `(${this.namespace})`, ...args);
  }

  end(...args: unknown[]): never {
    this.error(...args);
    process.exit(1);
  }
}
