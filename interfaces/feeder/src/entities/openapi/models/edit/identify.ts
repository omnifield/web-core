import type { IncomingDocument, SchemaDocument } from "../types";

export function identify(document: IncomingDocument): SchemaDocument {
  return {
    endpoints: document.endpoints.map((endpoint) => ({
      ...endpoint,
      id: crypto.randomUUID(),
    })),
    defs: document.defs,
  };
}
