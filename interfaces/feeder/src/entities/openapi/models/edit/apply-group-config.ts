import type { Draft } from "@web-core/store/mutate";

import type { GroupConfig } from "../config";
import type { SchemaDocument } from "../types";

export function applyGroupConfig(
  document: Draft<SchemaDocument>,
  groupId: string,
  config: GroupConfig,
): void {
  const group = document.groups.find((one) => one.id === groupId);
  if (group === undefined) return;

  group.name = config.name;
}
