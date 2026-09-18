import type { OpenapiEndpoint } from "./types";

export const NO_TAG = "Без тега";

export interface EndpointGroup {
  readonly tag: string;
  readonly endpoints: readonly OpenapiEndpoint[];
}

export function groupEndpoints(
  endpoints: readonly OpenapiEndpoint[],
): readonly EndpointGroup[] {
  const byTag = new Map<string, OpenapiEndpoint[]>();

  for (const endpoint of endpoints) {
    const tag = endpoint.tag ?? NO_TAG;
    const group = byTag.get(tag);
    if (group === undefined) byTag.set(tag, [endpoint]);
    else group.push(endpoint);
  }

  const untagged = byTag.get(NO_TAG);
  byTag.delete(NO_TAG);

  const groups = [...byTag].map(([tag, items]) => ({ tag, endpoints: items }));
  if (untagged !== undefined) groups.push({ tag: NO_TAG, endpoints: untagged });

  return groups;
}
