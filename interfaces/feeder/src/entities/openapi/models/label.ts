import type { EndpointDescriptor } from "./types";

export function endpointLabel(endpoint: EndpointDescriptor): string {
  const name = endpoint.name?.trim();

  return name === undefined || name === "" ? `${endpoint.method} ${endpoint.url}` : name;
}
