// см. README.md / FAQ.md

import { readAddress, type Registry } from "./registry.js";
import { isElement, type AssemblyTree, type NodeId } from "./tree.js";

export interface NodeCoordinate {
  readonly component: string;
  readonly part: string;
  readonly address: string;
}

export function coordinateOfType(registry: Registry, type: string): NodeCoordinate | undefined {
  const read = readAddress(registry, type);
  if (!read) return undefined;

  return { component: read.component, part: read.part, address: read.address };
}

export function nodesByCoordinate(
  tree: AssemblyTree,
  registry: Registry,
): Map<string, NodeId[]> {
  const groups = new Map<string, NodeId[]>();

  // Координата — паспортная половина адреса правила скина: она есть у частей компонента и её
  // нет ни у содержимого, ни у ссылки на модуль (у той свой адрес — имя модуля, не пара
  // компонент+часть).
  for (const [id, node] of Object.entries(tree.components.nodes)) {
    if (!isElement(node)) continue;

    const coordinate = coordinateOfType(registry, node.type);
    if (!coordinate) continue;

    const kin = groups.get(coordinate.address);
    if (kin) kin.push(id);
    else groups.set(coordinate.address, [id]);
  }

  return groups;
}

export function nodesSharingCoordinate(
  tree: AssemblyTree,
  registry: Registry,
  nodeId: NodeId,
): NodeId[] | undefined {
  const node = tree.components.nodes[nodeId];
  if (!node || !isElement(node)) return undefined;

  const coordinate = coordinateOfType(registry, node.type);
  if (!coordinate) return undefined;

  return (nodesByCoordinate(tree, registry).get(coordinate.address) ?? []).filter(
    (kin) => kin !== nodeId,
  );
}
