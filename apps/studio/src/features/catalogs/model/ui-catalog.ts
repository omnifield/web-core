import type { TreeItemData } from "@web-core/ui";
import { componentsTree } from "#/entities/component";
import { modulesTree } from "#/entities/module";

/** Один каталог: чем назван, чем наполнен и куда ведёт выбор пункта. */
export interface Catalog {
  readonly value: string;
  readonly label: string;
  readonly items: () => readonly TreeItemData[];
  readonly to: string;
}

export function uiCatalog(): readonly Catalog[] {
  return [
    {
      value: "components",
      label: "Компоненты",
      items: componentsTree,
      to: "/showcase/component/{-$name}",
    },
    {
      value: "modules",
      label: "Модули",
      items: modulesTree,
      to: "/showcase/module/{-$name}",
    },
  ];
}
