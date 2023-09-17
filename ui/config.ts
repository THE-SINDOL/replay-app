export type AppEnv = "development" | "production";

export const AppEnv: AppEnv =
  (process.env.APP_ENV as AppEnv) || (process.env.NEXT_PUBLIC_APP_ENV as AppEnv) || "development";

export const isProd = process.env.NODE_ENV === "production" || AppEnv === "production";
export const isElectron = Boolean(process.env.ELECTRON);
