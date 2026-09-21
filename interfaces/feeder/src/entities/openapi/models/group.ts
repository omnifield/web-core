import type { EndpointDescriptor, SchemaDocument } from "./types";

export const UNKNOWN_GROUP = "unknown";

export interface EndpointGroup {
  readonly id: string;
  readonly name: string;
  readonly endpoints: readonly EndpointDescriptor[];
}

export function groupEndpoints(document: SchemaDocument): readonly EndpointGroup[] {
  const byGroup = new Map<string, EndpointDescriptor[]>();

  for (const endpoint of document.endpoints) {
    const bucket = byGroup.get(endpoint.groupId);
    if (bucket === undefined) byGroup.set(endpoint.groupId, [endpoint]);
    else bucket.push(endpoint);
  }

  return document.groups.map((group) => ({
    id: group.id,
    name: group.name,
    endpoints: byGroup.get(group.id) ?? [],
  }));
}
