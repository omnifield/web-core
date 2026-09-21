import { UNKNOWN_GROUP } from "../group";
import type { Group, IncomingDocument, SchemaDocument } from "../types";

export function identify(document: IncomingDocument): SchemaDocument {
  const byName = new Map<string, Group>();

  const groupOf = (name: string): Group => {
    const known = byName.get(name);
    if (known !== undefined) return known;

    const group = { id: crypto.randomUUID(), name };
    byName.set(name, group);
    return group;
  };

  const endpoints = document.endpoints.map(({ tag, ...endpoint }) => ({
    ...endpoint,
    id: crypto.randomUUID(),
    groupId: groupOf(tag ?? UNKNOWN_GROUP).id,
  }));

  return { endpoints, groups: [...byName.values()], defs: document.defs };
}
