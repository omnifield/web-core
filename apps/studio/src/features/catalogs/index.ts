import type { TreeItemData } from "@web-core/ui";
import { componentsTree } from "#/entities/component";
import { modulesTree } from "#/entities/module";

/** Один каталог: чем назван и чем наполнен. */
export interface Catalog {
  readonly value: string;
  readonly label: string;
  readonly items: () => readonly TreeItemData[];
}

export function catalogs(): readonly Catalog[] {
  return [
    { value: "components", label: "Компоненты", items: componentsTree },
    { value: "modules", label: "Модули", items: modulesTree },
  ];
}
