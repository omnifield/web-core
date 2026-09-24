// Модули витрины лежат данными (JSON), значит типы их не держат: спеку проверяет только сборка.
// Тест собирает КАЖДЫЙ шаблон настоящим реестром кита и держит контракт входа: подписанный узел
// адресуется своим именем и кормится по форме своего компонента.

import { describe, expect, it } from "vitest";
import {
  composeTree,
  type CompositionElement,
  type CompositionSpec,
} from "@web-core/assembly";
import { kitComponentRenderer } from "@web-core/ui/component-registry";
import type { TreeItemData } from "@web-core/ui";
import {
  MODULE_GROUPS,
  MODULE_TEMPLATES,
  moduleIoOf,
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

const childrenOf = (spec: CompositionElement): readonly CompositionElement[] =>
  (spec.children ?? []).filter(isElement);

function boundNodesIn(
  spec: CompositionElement,
): readonly { id: string | undefined; paths: readonly string[] }[] {
  const own =
    spec.bind === undefined
      ? []
      : [{ id: spec.id, paths: Object.values(spec.bind) }];

  return [...own, ...childrenOf(spec).flatMap(boundNodesIn)];
}

const ownerOf = (path: string): string | undefined => path.split("/")[1];

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

describe("вход модуля виден снаружи и адресуется именем узла", () => {
  it.each([...TEMPLATES])("«$value» — имена узлов уникальны", (template: ModuleTemplate) => {
    const ids = moduleIoOf(template).map((input) => input.id);

    expect(ids).toEqual([...new Set(ids)]);
  });

  it.each([...TEMPLATES])("«$value» — у подписанного узла компонент объявил форму", (template: ModuleTemplate) => {
    const speechless = moduleIoOf(template)
      .filter((input) => input.io?.input === undefined)
      .map((input) => `${input.id} (${input.component})`);

    expect(speechless).toEqual([]);
  });

  it.each([...TEMPLATES])("«$value» — байндинг адресует свой же узел", (template: ModuleTemplate) => {
    const alien = boundNodesIn(template.composition).flatMap((node) =>
      node.paths.filter((path) => ownerOf(path) !== node.id),
    );

    expect(alien).toEqual([]);
  });
});
