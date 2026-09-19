import type { HttpMethod } from "./types";

export function endpointKey(endpoint: { readonly method: HttpMethod; readonly url: string }): string {
  return `${endpoint.method} ${endpoint.url}`;
}
