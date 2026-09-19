import type { EndpointDescriptor, Group, SchemaDocument } from "./types";

function isGroup(value: unknown): value is Group {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Partial<Group>;
  return typeof item.id === "string" && typeof item.name === "string";
}

function isEndpoint(value: unknown): value is EndpointDescriptor {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Partial<EndpointDescriptor>;
  return (
    typeof item.id === "string" &&
    typeof item.method === "string" &&
    typeof item.url === "string" &&
    Array.isArray(item.params)
  );
}

export function asSchemaDocument(value: unknown): SchemaDocument | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const document = value as Partial<SchemaDocument>;
  if (!Array.isArray(document.endpoints) || !document.endpoints.every(isEndpoint)) return undefined;

  const groups = document.groups ?? [];
  if (!Array.isArray(groups) || !groups.every(isGroup)) return undefined;

  return { endpoints: document.endpoints, groups, defs: document.defs ?? {} };
}
