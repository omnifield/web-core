// см. README.md / FAQ.md

import { moduleCycleOf } from "./modules.js";
import { canAdmit, canContain, canHoldModule, type NestingRefusal } from "./nesting.js";
import type { Genus } from "./passport-read.js";
import type { Registry } from "./registry.js";
import {
  isContent,
  isElement,
  isReference,
  nodeOf,
  subtreeOf,
  type AssemblyContent,
  type AssemblyElement,
  type AssemblyReference,
  type AssemblyNode,
  type AssemblyTree,
  type DispatchAction,
  type NodeId,
} from "./tree.js";

export type EditRefusal =
  | "node-unknown"
  | "parent-unknown"
  | "id-taken"
  | "root-locked"
  | "into-own-subtree"
  | "content-holds-nothing"
  | "reference-holds-nothing"
  | "patch-not-of-node"
  | "module-cycle"
  | NestingRefusal;

export type EditResult =
  | { readonly ok: true; readonly tree: AssemblyTree }
  | { readonly ok: false; readonly refusal: EditRefusal; readonly means: string };

export interface NewElement {
  readonly id: NodeId;
  readonly type: string;
  readonly composedInto?: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Record<string, DispatchAction>>;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface NewContent {
  readonly id: NodeId;
  readonly genus: Genus;
  readonly value: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export interface NewReference {
  readonly id: NodeId;
  readonly module: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, string>>;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export type NewNode = NewElement | NewContent | NewReference;

const isContentSpec = (node: NewNode): node is NewContent => "genus" in node;

const isReferenceSpec = (node: NewNode): node is NewReference => "module" in node;

const refuse = (refusal: EditRefusal, means: string): EditResult => ({
  ok: false,
  refusal,
  means,
});

type Placed =
  | { readonly genus: Genus }
  | { readonly module: string }
  | { readonly type: string; readonly composedInto?: string };

const refuseContentOwner = (owner: AssemblyContent): EditResult =>
  refuse(
    "content-holds-nothing",
    `«${owner.id}» — узел содержимого рода «${owner.genus}»: внутрь него не кладётся ничего`,
  );

/** Внутрь ссылки не кладётся ничего по той же причине, что и внутрь содержимого, но причина
 * НАЗВАНА отдельно: здесь дело не в роде значения, а в том, что содержимое узла принадлежит
 * ЧУЖОМУ дереву — править его надо там, где оно объявлено. */
const refuseReferenceOwner = (owner: AssemblyReference): EditResult =>
  refuse(
    "reference-holds-nothing",
    `«${owner.id}» — ссылка на модуль «${owner.module}»: своих детей у неё нет, содержимое правится в самом модуле`,
  );

const refusePlacement = (
  registry: Registry,
  ownerType: string,
  placed: Placed,
): EditResult | undefined => {
  if ("genus" in placed) {
    const admitted = canAdmit(registry, ownerType, { kind: "content", genus: placed.genus });
    return admitted.allowed ? undefined : refuse(admitted.refusal, admitted.means);
  }

  if ("module" in placed) {
    const held = canHoldModule(registry, ownerType, placed.module);
    return held.allowed ? undefined : refuse(held.refusal, held.means);
  }

  const { type, composedInto } = placed;

  const place = canContain(registry, ownerType, composedInto ?? type);
  if (!place.allowed) return refuse(place.refusal, place.means);

  if (composedInto === undefined) return undefined;

  const composition = canContain(registry, composedInto, type);
  if (!composition.allowed) {
    return refuse(
      composition.refusal,
      `вставить «${type}» в «${composedInto}» нельзя: ${composition.means}`,
    );
  }

  return undefined;
};

// Правка меняет УЗЛЫ, а не дерево целиком: всё остальное (`root`, `providerProps`, имя дерева в
// источнике модулей) переносится как было. Прежняя форма пересобирала `components` из двух полей
// и молча теряла соседние — на `module` это видно сразу, цикл после первой же правки перестал бы
// вычисляться.
const withNodes = (
  tree: AssemblyTree,
  nodes: Record<NodeId, AssemblyNode>,
): AssemblyTree => ({ components: { ...tree.components, nodes } });

const withoutChild = (owner: AssemblyNode, id: NodeId): AssemblyNode =>
  isElement(owner)
    ? { ...owner, children: owner.children.filter((child) => child !== id) }
    : owner;

const insertAt = (children: readonly NodeId[], id: NodeId, index?: number): NodeId[] => {
  const next = [...children];
  const place = index === undefined ? next.length : Math.max(0, Math.min(index, next.length));
  next.splice(place, 0, id);
  return next;
};

export function insertNode(
  tree: AssemblyTree,
  registry: Registry,
  node: NewNode,
  parentId: NodeId,
  index?: number,
): EditResult {
  const owner = nodeOf(tree, parentId);
  if (!owner) {
    return refuse("parent-unknown", `узла «${parentId}» в дереве нет — вкладывать некуда`);
  }
  if (nodeOf(tree, node.id)) {
    return refuse("id-taken", `имя «${node.id}» в дереве уже занято`);
  }
  if (isContent(owner)) return refuseContentOwner(owner);
  if (isReference(owner)) return refuseReferenceOwner(owner);

  const refusal = refusePlacement(registry, owner.type, node);
  if (refusal) return refusal;

  if (isReferenceSpec(node)) {
    const host = tree.components.module;
    const cycle = host === undefined ? undefined : moduleCycleOf(registry, host, node.module);
    if (cycle) {
      return refuse(
        "module-cycle",
        `модуль «${node.module}» внутри «${host}» замкнул бы круг: ${[host, ...cycle].join(" → ")}`,
      );
    }
  }

  const added: AssemblyNode = isContentSpec(node)
    ? {
        id: node.id,
        genus: node.genus,
        value: node.value,
        parentId,
        children: [] as const,
        ...(node.meta ? { meta: node.meta } : {}),
      }
    : isReferenceSpec(node)
      ? {
          id: node.id,
          module: node.module,
          parentId,
          children: [] as const,
          ...(node.props ? { props: node.props } : {}),
          ...(node.bind ? { bind: node.bind } : {}),
          ...(node.meta ? { meta: node.meta } : {}),
        }
      : {
          id: node.id,
          type: node.type,
          ...(node.composedInto ? { composedInto: node.composedInto } : {}),
          parentId,
          children: [],
          ...(node.props ? { props: node.props } : {}),
          ...(node.bind ? { bind: node.bind } : {}),
          ...(node.on ? { on: node.on } : {}),
          ...(node.meta ? { meta: node.meta } : {}),
        };

  const nodes = { ...tree.components.nodes };
  nodes[node.id] = added;
  nodes[parentId] = { ...owner, children: insertAt(owner.children, node.id, index) };

  return { ok: true, tree: withNodes(tree, nodes) };
}

export function removeNode(tree: AssemblyTree, id: NodeId): EditResult {
  const node = nodeOf(tree, id);
  if (!node) return refuse("node-unknown", `узла «${id}» в дереве нет`);
  if (id === tree.components.root) {
    return refuse("root-locked", `«${id}» — корень дерева: без него дерева не останется`);
  }

  const nodes = { ...tree.components.nodes };
  for (const gone of subtreeOf(tree, id)) delete nodes[gone];

  const ownerId = node.parentId;
  if (ownerId !== null) {
    const owner = nodes[ownerId];
    if (owner) nodes[ownerId] = withoutChild(owner, id);
  }

  return { ok: true, tree: withNodes(tree, nodes) };
}

export function moveNode(
  tree: AssemblyTree,
  registry: Registry,
  id: NodeId,
  parentId: NodeId,
  index?: number,
): EditResult {
  const node = nodeOf(tree, id);
  if (!node) return refuse("node-unknown", `узла «${id}» в дереве нет`);
  if (id === tree.components.root) {
    return refuse("root-locked", `«${id}» — корень дерева: переносить его некуда`);
  }

  const owner = nodeOf(tree, parentId);
  if (!owner) return refuse("parent-unknown", `узла «${parentId}» в дереве нет — переносить некуда`);

  if (subtreeOf(tree, id).includes(parentId)) {
    return refuse(
      "into-own-subtree",
      `«${parentId}» лежит внутри «${id}» — узел нельзя положить в самого себя`,
    );
  }

  if (isContent(owner)) return refuseContentOwner(owner);
  if (isReference(owner)) return refuseReferenceOwner(owner);

  const refusal = refusePlacement(registry, owner.type, node);
  if (refusal) return refusal;

  const nodes = { ...tree.components.nodes };

  const previousId = node.parentId;
  if (previousId !== null) {
    const previous = nodes[previousId];
    if (previous) nodes[previousId] = withoutChild(previous, id);
  }

  const target = nodes[parentId] as AssemblyElement;
  nodes[parentId] = { ...target, children: insertAt(target.children, id, index) };
  nodes[id] = { ...node, parentId };

  return { ok: true, tree: withNodes(tree, nodes) };
}

export interface NodePatch {
  readonly props?: Readonly<Record<string, unknown>>;
  readonly value?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

export function updateNode(tree: AssemblyTree, id: NodeId, patch: NodePatch): EditResult {
  const node = nodeOf(tree, id);
  if (!node) return refuse("node-unknown", `узла «${id}» в дереве нет`);

  const nodes = { ...tree.components.nodes };

  if (isContent(node)) {
    if ("props" in patch) {
      return refuse(
        "patch-not-of-node",
        `«${id}» — узел содержимого: пропов у него нет, правится значение`,
      );
    }
    nodes[id] = {
      ...node,
      ...(patch.value !== undefined ? { value: patch.value } : {}),
      ...("meta" in patch ? { meta: patch.meta } : {}),
    };

    return { ok: true, tree: withNodes(tree, nodes) };
  }

  if ("value" in patch) {
    return refuse(
      "patch-not-of-node",
      isReference(node)
        ? `«${id}» — ссылка на модуль «${node.module}»: значения у неё нет, содержимое живёт в самом модуле`
        : `«${id}» — узел компонента «${node.type}»: значения у него нет, содержимое лежит отдельным узлом`,
    );
  }

  nodes[id] = {
    ...node,
    ...("props" in patch ? { props: patch.props } : {}),
    ...("meta" in patch ? { meta: patch.meta } : {}),
  };

  return { ok: true, tree: withNodes(tree, nodes) };
}
