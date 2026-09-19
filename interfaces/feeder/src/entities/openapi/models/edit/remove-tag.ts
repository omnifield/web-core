import type { Draft } from "@web-core/store/mutate";

import { NO_TAG } from "../group";
import type { SchemaDocument } from "../types";

export function removeTag(document: Draft<SchemaDocument>, tag: string): void {
  for (let at = document.endpoints.length - 1; at >= 0; at -= 1) {
    if ((document.endpoints[at]?.tag ?? NO_TAG) === tag) document.endpoints.splice(at, 1);
  }
}
