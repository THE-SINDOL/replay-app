/*
 * Copyright (c) 2022 Kiyozz.
 *
 * All rights reserved.
 */

import type { EnvConfig } from "../config.mts";
import type { Target, TypeConfig } from "../enums.mts";
import type { ConfigMapping } from "../types.mts";

export interface Configurator<P extends TypeConfig> {
  readonly type: TypeConfig;
  readonly config: EnvConfig;

  toBuilderConfig(partial: Partial<ConfigMapping[P]>, config: ConfigMapping[P], target: Target): ConfigMapping[P];
}
