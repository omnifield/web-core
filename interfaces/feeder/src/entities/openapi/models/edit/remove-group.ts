import type { Draft } from "@web-core/store/mutate";

import { NO_GROUP } from "../group";
import type { SchemaDocument } from "../types";

export function removeGroup(document: Draft<SchemaDocument>, id: string): void {
  const owner = id === NO_GROUP ? undefined : id;

  for (let at = document.endpoints.length - 1; at >= 0; at -= 1) {
    if (document.endpoints[at]?.groupId === owner) document.endpoints.splice(at, 1);
  }

  const at = document.groups.findIndex((group) => group.id === id);
  if (at !== -1) document.groups.splice(at, 1);
}
