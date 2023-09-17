import { app } from "electron";
process.env.NODE_OPTIONS = "--max-old-space-size=32678";
app.commandLine.appendSwitch('--js-flags="--max-old-space-size=32678');
app.commandLine.appendSwitch("ignore-connections-limit", "localhost");
// app.commandLine.appendSwitch(
//   "enable-features",
//   "HardwareMediaKeyHandling,MediaSessionService,WebGPU,WebGPUDeveloperFeatures,WebGPUImportTexture,CSSVideoDynamicRangeMediaQueries,ExtraWebGLVideoTextureMetadata",
// );
// app.commandLine.appendArgument("--enable-experimental-web-platform-features");
app.commandLine.appendSwitch("--remote-allow-origins=*");
