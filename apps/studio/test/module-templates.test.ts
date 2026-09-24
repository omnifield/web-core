// Модули витрины лежат данными (JSON), значит типы их не держат: спеку проверяет только сборка.
// Тест собирает КАЖДЫЙ шаблон настоящим реестром кита и сверяет, что путь каждого байндинга
// находит секцию в выгрузке склада, — иначе модуль тихо рисуется пустым.

import { describe, expect, it } from "vitest";
import {
  composeTree,
  resolveDataBinding,
  type CompositionElement,
  type CompositionSpec,
} from "@web-core/assembly";
import { kitComponentRenderer } from "@web-core/ui/component-registry";
import type { TreeItemData } from "@web-core/ui";
import {
  MODULE_DATA,
  MODULE_GROUPS,
  MODULE_TEMPLATES,
  type ModuleGroup,
  type ModuleTemplate,
  modulesTree,
} from "#/entities/module";

const { registry } = kitComponentRenderer();

const TEMPLATES = MODULE_TEMPLATES;

const shapeOf = (group: ModuleGroup): unknown => [
  group.value,
  [
    ...group.groups.map(shapeOf),
    ...group.templates.map((template) => template.value),
  ],
];

const isElement = (spec: CompositionSpec): spec is CompositionElement =>
  !("genus" in spec) && !("module" in spec);

function bindingsOf(spec: CompositionElement): readonly string[] {
  const own = Object.values(spec.bind ?? {});
  const inner = (spec.children ?? [])
    .filter(isElement)
    .flatMap((child) => bindingsOf(child));

  return [...own, ...inner];
}

describe("шаблоны модулей собираются настоящим реестром кита", () => {
  it.each([...TEMPLATES])("«$value» — ни одного отказа вложенности", (template: ModuleTemplate) => {
    const result = composeTree(registry, template.composition);

    expect(result.ok ? [] : result.refusals.map((one) => one.means)).toEqual([]);
  });

  it("дерево каталога повторяет группы, вложенные группы и их состав", () => {
    const nodeShapeOf = (node: TreeItemData): unknown =>
      node.children === undefined
        ? node.value
        : [node.value, node.children.map(nodeShapeOf)];

    expect(modulesTree().map(nodeShapeOf)).toEqual(MODULE_GROUPS.map(shapeOf));
  });
});

describe("байндинги шаблонов адресуют настоящие секции склада", () => {
  it.each([...TEMPLATES])("«$value» — каждый путь находит значение", (template: ModuleTemplate) => {
    const missing = bindingsOf(template.composition).filter(
      (path) => resolveDataBinding(MODULE_DATA, path) === undefined,
    );

    expect(missing).toEqual([]);
  });
});
