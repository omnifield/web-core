import type { TreeItemData } from "@web-core/ui";
import { MODULE_GROUPS, type ModuleGroup } from "./templates";

function itemOf(group: ModuleGroup): TreeItemData {
  return {
    value: group.value,
    label: group.label,
    children: [
      ...group.groups.map(itemOf),
      ...group.templates.map(({ value, label }) => ({ value, label })),
    ],
  };
}

export function modulesTree(): readonly TreeItemData[] {
  return MODULE_GROUPS.map(itemOf);
}
