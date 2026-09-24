import type { CompositionElement } from "@web-core/assembly";
import { ANALYTICS_LEVELS } from "./analytics";
import testModule from "./test-module.json";

/** Модуль витрины: имя для адреса, ярлык для дерева, спека сборки для `composeTree`. */
export interface ModuleTemplate {
  readonly value: string;
  readonly label: string;
  readonly composition: CompositionElement;
}

/** Группа модулей — узел дерева каталога: под ним либо сами модули, либо вложенные группы. */
export interface ModuleGroup {
  readonly value: string;
  readonly label: string;
  readonly groups: readonly ModuleGroup[];
  readonly templates: readonly ModuleTemplate[];
}

// Спека лежит данными, а не кодом: JSON-импорт расширяет литералы до `string` — FAQ.md.
const modules = (
  value: string,
  label: string,
  templates: readonly { value: string; label: string; composition: unknown }[],
): ModuleGroup => ({
  value,
  label,
  groups: [],
  templates: templates.map((template) => ({
    value: template.value,
    label: template.label,
    composition: template.composition as CompositionElement,
  })),
});

const nested = (
  value: string,
  label: string,
  groups: readonly ModuleGroup[],
): ModuleGroup => ({ value, label, groups, templates: [] });

export const MODULE_GROUPS: readonly ModuleGroup[] = [
  nested(
    "analytics",
    "Аналитика",
    ANALYTICS_LEVELS.map((level) =>
      modules(level.value, level.label, level.templates),
    ),
  ),
  modules("probes", "Пробы", [
    { value: "test-module", label: "Тестовый модуль", composition: testModule },
  ]),
];

/** Все модули всех групп подряд — адресация идёт по имени, а не по месту в дереве. */
export const MODULE_TEMPLATES: readonly ModuleTemplate[] = MODULE_GROUPS.flatMap(
  function templatesIn(group: ModuleGroup): readonly ModuleTemplate[] {
    return [...group.templates, ...group.groups.flatMap(templatesIn)];
  },
);

export function moduleTemplateOf(value: string): ModuleTemplate | undefined {
  return MODULE_TEMPLATES.find((template) => template.value === value);
}
