import type { Client } from "./types";

export type CreateSongOptions = NonNullable<Parameters<Client["createSong"]>["1"]>["options"];
export type JobsResponse = Awaited<ReturnType<Client["jobs"]>>["data"]["jobs"];
export type StemmingModel = Awaited<ReturnType<Client["stemmingModels"]>>["data"]["models"][number];
export type Job = NonNullable<JobsResponse>[number];
export type RecursiveNonNullable<T> = { [K in keyof T]: NonNullable<T[K]> };
