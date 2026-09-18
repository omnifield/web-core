import type { OpenapiEndpoint } from "./types.js";

export function endpointKey(endpoint: OpenapiEndpoint): string {
  return `${endpoint.method} ${endpoint.url}`;
}
