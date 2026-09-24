import type { Draft } from "@web-core/store/mutate";

import type { SchemaDocument } from "../types";

export function addEndpoint(document: Draft<SchemaDocument>, groupId: string): string {
  const id = crypto.randomUUID();
  const first = document.endpoints.findIndex((endpoint) => endpoint.groupId === groupId);

  document.endpoints.splice(first === -1 ? 0 : first, 0, {
    id,
    method: "GET",
    url: "",
    groupId,
    params: [],
  });

  return id;
}
