interface Window {
  paths: {
    RESOURCES_PATH: string;
  };
  config: {
    isSettings: string;
    deviceId: string;
  };
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  fs: typeof import("fs/promises");
}
