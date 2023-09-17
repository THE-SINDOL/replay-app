/*
 * Copyright (c) 2022 Kiyozz.
 *
 * All rights reserved.
 */

import type { BuildOptions } from "esbuild";
import type { InlineConfig } from "vite";

import type { TypeConfig } from "./enums.mts";

export type PossibleConfiguration = BuildOptions | InlineConfig;

export interface ConfigMapping {
  [TypeConfig.esbuild]: BuildOptions;
  [TypeConfig.vite]: InlineConfig;
}
