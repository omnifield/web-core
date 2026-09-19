import type { Draft } from "@web-core/store/mutate";

import { NO_GROUP } from "../group";
import type { SchemaDocument } from "../types";

export function addEndpoint(document: Draft<SchemaDocument>, groupId?: string): string {
  const id = crypto.randomUUID();
  const owner = groupId === NO_GROUP ? undefined : groupId;
  const first = document.endpoints.findIndex((endpoint) => endpoint.groupId === owner);

  document.endpoints.splice(first === -1 ? 0 : first, 0, {
    id,
    method: "GET",
    url: "",
    params: [],
    ...(owner === undefined ? {} : { groupId: owner }),
  });

  return id;
}
