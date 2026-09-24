import type { Draft } from "@web-core/store/mutate";

import type { SchemaDocument } from "../types";

export const NEW_GROUP = "Новая группа";

export function addGroup(document: Draft<SchemaDocument>, name: string = NEW_GROUP): string {
  const id = crypto.randomUUID();

  document.groups.unshift({ id, name });

  return id;
}
