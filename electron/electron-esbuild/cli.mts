/*
 * Copyright (c) 2022 Kiyozz.
 *
 * All rights reserved.
 */

import type { Result, AnyFlags } from "meow";

export interface CliFlags extends AnyFlags {
  clean: {
    type: "boolean";
    default: true;
  };
}

export type CliResult = Result<CliFlags>;

export abstract class Cli {
  protected constructor(protected cli: CliResult) {}

  abstract init(): Promise<void>;
}
