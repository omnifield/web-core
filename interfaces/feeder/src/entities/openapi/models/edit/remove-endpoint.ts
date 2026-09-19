import type { Draft } from "@web-core/store/mutate";

import { endpointKey } from "../key";
import type { SchemaDocument } from "../types";

export function removeEndpoint(document: Draft<SchemaDocument>, id: string): void {
  const at = document.endpoints.findIndex((endpoint) => endpointKey(endpoint) === id);
  if (at !== -1) document.endpoints.splice(at, 1);
}
