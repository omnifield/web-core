import type { EndpointDescriptor, SchemaDocument } from "./types";

function isEndpoint(value: unknown): value is EndpointDescriptor {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Partial<EndpointDescriptor>;
  return typeof item.method === "string" && typeof item.url === "string" && Array.isArray(item.params);
}

export function asSchemaDocument(value: unknown): SchemaDocument | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const document = value as Partial<SchemaDocument>;
  if (!Array.isArray(document.endpoints) || !document.endpoints.every(isEndpoint)) return undefined;

  return { endpoints: document.endpoints, defs: document.defs ?? {} };
}
