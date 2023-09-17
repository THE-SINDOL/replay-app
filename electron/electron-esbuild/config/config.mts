/*
 * Copyright (c) 2022 Kiyozz.
 *
 * All rights reserved.
 */

import type { BuildOptions } from "esbuild";
import type { InlineConfig } from "vite";

import type { Configurator } from "./configurators/base.configurator.mts";
import { EsbuildConfigurator } from "./configurators/esbuild.configurator.mts";
import { ViteConfigurator } from "./configurators/vite.configurator.mts";
import { Target, TypeConfig } from "./enums.mts";
import type { PossibleConfiguration } from "./types.mts";
import type { YamlItem } from "./yaml.mts";
import { EsbuildBuilder } from "../builder/esbuild.builder.mts";
import { ViteBuilder } from "../builder/vite.builder.mts";
import type { Builder } from "../builder.mts";
import { unsupportedType } from "../console.mts";

export interface EnvOutput {
  dir: string;
  filename: string;
}

export class EnvConfig {
  readonly type: TypeConfig;
  readonly path: string;
  readonly src: string;
  readonly output: EnvOutput;
  readonly html?: string;

  constructor({
    type,
    path,
    src,
    output,
    html,
  }: {
    type: TypeConfig;
    path: string;
    src: string;
    output: EnvOutput;
    html?: string;
  }) {
    this.type = type;
    this.path = path;
    this.src = src;
    this.output = output;
    this.html = html;
  }

  static fromYaml(yaml: YamlItem): EnvConfig {
    return new this({
      type: yaml.type,
      path: yaml.path,
      src: yaml.src,
      output: yaml.output,
      html: yaml.html,
    });
  }

  toConfigurator(): Configurator<TypeConfig> {
    switch (this.type) {
      case TypeConfig.esbuild:
        return new EsbuildConfigurator(this);
      case TypeConfig.vite:
        return new ViteConfigurator(this);
      default:
        unsupportedType(this.type);
    }
  }
}

export class Item<
  T extends PossibleConfiguration | null = PossibleConfiguration,
  F extends EnvConfig | null = EnvConfig | null,
> {
  readonly config: T;
  readonly fileConfig: F;
  readonly target: Target;
  readonly isVite: boolean;
  readonly isEsbuild: boolean;
  readonly isMain: boolean;
  readonly isRenderer: boolean;

  constructor({ config, fileConfig, target }: { config: T; fileConfig: F; target: Target }) {
    this.config = config;
    this.fileConfig = fileConfig;
    this.target = target;
    this.isVite = this.fileConfig?.type === TypeConfig.vite;
    this.isEsbuild = this.fileConfig?.type === TypeConfig.esbuild;
    this.isMain = this.target === Target.main;
    this.isRenderer = this.target === Target.renderer;
  }

  async toBuilderAsync(): Promise<Builder | null> {
    if (this.isEsbuild) {
      return new EsbuildBuilder(this as Item<BuildOptions>);
    } else if (this.isVite) {
      return await ViteBuilder.create(this as Item<InlineConfig>);
    }

    if (this.fileConfig !== null) {
      unsupportedType(this.fileConfig.type, this.isMain ? "main" : "renderer");
    }

    return null;
  }
}

export class Config<M extends PossibleConfiguration, R extends PossibleConfiguration> {
  readonly main: Item<M, EnvConfig>;
  readonly renderer: Item<R | null>;

  constructor({ main, renderer }: { main: Item<M, EnvConfig>; renderer: Item<R | null> }) {
    this.main = main;
    this.renderer = renderer;
  }

  async toBuildersAsync(): Promise<readonly [Builder, Builder | null]> {
    return [(await this.main.toBuilderAsync()) as Builder, await this.renderer.toBuilderAsync()];
  }
}
