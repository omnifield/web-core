import type { Group, IncomingDocument, SchemaDocument } from "../types";

export function identify(document: IncomingDocument): SchemaDocument {
  const byName = new Map<string, Group>();

  const endpoints = document.endpoints.map(({ tag, ...endpoint }) => {
    if (tag === undefined) return { ...endpoint, id: crypto.randomUUID() };

    const group = byName.get(tag) ?? { id: crypto.randomUUID(), name: tag };
    byName.set(tag, group);

    return { ...endpoint, id: crypto.randomUUID(), groupId: group.id };
  });

  return { endpoints, groups: [...byName.values()], defs: document.defs };
}
