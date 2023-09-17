import https from "https";
import type { AgentOptions } from "http";
import http from "http";

const options = {
  keepAlive: true,
  family: 4, // default to ipv4
} as AgentOptions;
export const httpsAgent = new https.Agent(options);
export const httpAgent = new http.Agent(options);
