import type { TreeItemData } from "@web-core/ui";
import { componentsTree } from "#/entities/component";
import { modulesTree } from "#/entities/module";

/** Один каталог: чем назван, чем наполнен и в какой параметр маршрута ложится выбранный пункт.
 *  Адреса здесь нет намеренно — каталог не знает, на какой он странице. */
export interface Catalog {
  readonly value: string;
  readonly label: string;
  readonly items: () => readonly TreeItemData[];
  readonly param: string;
}

export const UI_CATALOGS: readonly Catalog[] = [
  {
    value: "components",
    label: "Компоненты",
    items: componentsTree,
    param: "component",
  },
  {
    value: "modules",
    label: "Модули",
    items: modulesTree,
    param: "module",
  },
];
