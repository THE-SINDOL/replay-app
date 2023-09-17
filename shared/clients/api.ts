import logger from "../logger";
import openapi from "../openapi.json" assert { type: "json" };
import OpenAPIClientAxios from "openapi-client-axios";
import type { Document } from "openapi-client-axios/types/client";
import type { Client } from "./types";
import { camelCase } from "lodash-es";
import { isAxiosError } from "axios";
export const apiPort = process.env.REPLAY_PORT ? parseInt(process.env.REPLAY_PORT) : 62362;

const generator = new OpenAPIClientAxios({
  definition: openapi as Document,
  axiosConfigDefaults: {
    baseURL: `http://127.0.0.1:${apiPort}`,
  },
  transformOperationName: (operation) => {
    return camelCase(operation);
  },
});
export const api = generator.initSync<Client>();
const toFilter = ["/health", "/jobs", "/stemming_models"];
// add intercepter to log errors/responses
api.interceptors.response.use(
  (response) => {
    const url = response.config.url;
    if (toFilter.some((l) => url?.includes(l))) {
      // dont log anything for health check
      return response;
    }
    let suffix = "";
    if (response.data) {
      suffix = `\n${JSON.stringify(response.data || {}, null, 2)}`;
    }
    logger.info(`<== ${response.config.method?.toUpperCase()} ${url} - ${response.status}${suffix}`);
    return response;
  },
  (error) => {
    if (isAxiosError(error)) {
      const config = error.config;
      const url = config?.url;
      if (toFilter.some((l) => url?.includes(l))) {
        // dont log anything for health check
        return Promise.reject(error);
      }
      let suffix = "";
      if (error.response?.data) {
        suffix = `\n${JSON.stringify(error.response.data || {}, null, 2)}`;
      }
      const method = config?.method?.toUpperCase();
      const status = error.response?.status || "";
      logger.error(`<== ${method} ${url} - ${status} ${error.message}${suffix}`);
    } else {
      logger.error(error);
    }
    return Promise.reject(error);
  },
);

// add intercepter to log requests
api.interceptors.request.use((config) => {
  const url = config.url;
  if (toFilter.some((l) => url?.includes(l))) {
    // dont log anything for health check
    return config;
  }
  let suffix = "";
  if (config.data) {
    suffix = `\n${JSON.stringify(config.data || {}, null, 2)}`;
  }
  logger.info(`==> ${config.method?.toUpperCase()} ${url}${suffix}`);
  return config;
});

export default api;
