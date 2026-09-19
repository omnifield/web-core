import type { Draft } from "@web-core/store/mutate";

import { NO_TAG } from "../group";
import type { SchemaDocument } from "../types";

export function addEndpoint(document: Draft<SchemaDocument>, tag?: string): string {
  const id = crypto.randomUUID();
  const named = tag === undefined || tag === NO_TAG ? undefined : tag;
  const first = document.endpoints.findIndex(
    (endpoint) => (endpoint.tag ?? NO_TAG) === (named ?? NO_TAG),
  );

  document.endpoints.splice(first === -1 ? 0 : first, 0, {
    id,
    method: "GET",
    url: "",
    params: [],
    ...(named === undefined ? {} : { tag: named }),
  });

  return id;
}
