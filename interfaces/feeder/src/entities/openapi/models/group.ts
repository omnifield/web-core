import type { EndpointDescriptor, SchemaDocument } from "./types";

export const NO_GROUP = "unknown";

export interface EndpointGroup {
  readonly id: string;
  readonly name: string;
  readonly endpoints: readonly EndpointDescriptor[];
}

export function groupEndpoints(document: SchemaDocument): readonly EndpointGroup[] {
  const known = new Set(document.groups.map((group) => group.id));
  const byGroup = new Map<string, EndpointDescriptor[]>();

  for (const endpoint of document.endpoints) {
    const id =
      endpoint.groupId !== undefined && known.has(endpoint.groupId)
        ? endpoint.groupId
        : NO_GROUP;

    const bucket = byGroup.get(id);
    if (bucket === undefined) byGroup.set(id, [endpoint]);
    else bucket.push(endpoint);
  }

  const groups = document.groups.map((group) => ({
    id: group.id,
    name: group.name,
    endpoints: byGroup.get(group.id) ?? [],
  }));

  const loose = byGroup.get(NO_GROUP);
  if (loose !== undefined) groups.push({ id: NO_GROUP, name: NO_GROUP, endpoints: loose });

  return groups;
}
