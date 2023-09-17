/*
 * Copyright (c) 2022 Kiyozz.
 *
 * All rights reserved.
 */

import type { EnvConfig } from "./config.mts";
import type { TypeConfig } from "./enums.mts";

export interface YamlOutput {
  dir: string;
  filename: string;
}

export interface YamlItem {
  type: TypeConfig;
  path: string;
  src: string;
  output: YamlOutput;
  html?: string;
}

export interface YamlSkeleton {
  mainConfig: YamlItem;
  rendererConfig: YamlItem | null;
}

export class Yaml {
  readonly main: EnvConfig;
  readonly renderer: EnvConfig | null;

  constructor({ main, renderer }: { main: EnvConfig; renderer: EnvConfig | null }) {
    this.main = main;
    this.renderer = renderer;
  }
}
