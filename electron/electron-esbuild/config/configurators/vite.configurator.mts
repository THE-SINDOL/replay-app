/*
 * Copyright (c) 2022 Kiyozz.
 *
 * All rights reserved.
 */

import nodeModule from "node:module";
import type { InlineConfig } from "vite";

import type { Configurator } from "./base.configurator.mts";
import type { EnvConfig } from "../config.mts";
import { TypeConfig } from "../enums.mts";

export class ViteConfigurator implements Configurator<TypeConfig.vite> {
  public readonly type = TypeConfig.vite;

  constructor(public readonly config: EnvConfig) {}

  toBuilderConfig(partial: Partial<InlineConfig>): InlineConfig {
    let external = partial?.build?.rollupOptions?.external;

    if (!Array.isArray(external)) {
      external = [external as string];
    }

    return {
      build: {
        emptyOutDir: true,
        rollupOptions: {
          external: [...(external ?? []), "electron", ...nodeModule.builtinModules],
        },
      },
      server: {
        fs: {
          allow: ["../.."],
        },
      },
    };
  }
}
