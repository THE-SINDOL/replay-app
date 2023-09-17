import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { FAVORITES_CATEGORY } from "./hooks/categories.ts";
import type { RecursiveNonNullable, CreateSongOptions } from "@replay/shared/clients/type-utils.ts";

export type AdvancedOptions = NonNullable<RecursiveNonNullable<CreateSongOptions>>;
export interface VoiceModelFilters {
  classification?: string;
  gender?: string;
}
export type SongListSort = "date" | "model" | "track";
export interface AppContext {
  search: string | null;
  setSearch: (search: string | null) => void;
  modelId: string | null;
  setModelId: (modelId: string | null) => void;
  songUrlOrFilePath: string | null;
  setSongUrlOrFilePath: (songUrlOrFilePath: string | null) => void;
  options: AdvancedOptions;
  setAdvancedOptions: (options: AdvancedOptions) => void;
  selectedPlaybackSongId: string | null;
  setSelectedPlaybackSongId: (songId: string | null) => void;
  voiceModelFilters: VoiceModelFilters;
  setVoiceModelFilters: (classificationFilter: VoiceModelFilters) => void;
  songListSort: SongListSort;
  setSongListSort: (sort: SongListSort) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const useReplay = create<AppContext>()(
  devtools(
    persist(
      (set) => ({
        volume: 1.0,
        setVolume: (volume: number) => set({ volume }),
        songListSort: "date",
        setSongListSort: (songListSort: SongListSort) => set({ songListSort }),
        search: null,
        setSearch: (search: string | null) => set({ search }),
        modelId: null,
        setModelId: (modelId: string | null) => set({ modelId }),
        songUrlOrFilePath: null,
        setSongUrlOrFilePath: (songUrlOrFilePath: string | null) => set({ songUrlOrFilePath }),
        options: {
          pitch: 0,
          preStemmed: false,
          vocalsOnly: false,
          sampleMode: false,
          f0Method: "rmvpe",
          stemmingMethod: "UVR-MDX-NET Voc FT",
          indexRatio: 0.75,
          consonantProtection: 0.35,
          outputFormat: "mp3_320k",
          volumeEnvelope: 1.0,
        } as AdvancedOptions,
        setAdvancedOptions: (options: AdvancedOptions) => set({ options }),
        selectedPlaybackSongId: null,
        setSelectedPlaybackSongId: (songId: string | null) => set({ selectedPlaybackSongId: songId }),
        voiceModelFilters: {
          classification: FAVORITES_CATEGORY,
        },
        setVoiceModelFilters: (classificationFilter: VoiceModelFilters) =>
          set({ voiceModelFilters: classificationFilter }),
      }),
      {
        name: "replay-context",
      },
    ),
  ),
);

export { useReplay };
