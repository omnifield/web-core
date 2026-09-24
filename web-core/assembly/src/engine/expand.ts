// см. README.md / FAQ.md

import type { Genus, GrowablePassport } from "./passport-read.js";
import { isDataBinding, isElement, resolveDataBinding } from "./tree.js";
import type { AssemblyElement, AssemblyNode, AssemblyTree, DispatchAction, DynamicValue, NodeId } from "./tree.js";

// Своя структурная форма шаблона, не импортированная из типизированного авторского слоя —
// почему так, а не импортом, разобрано в FAQ.md.
export interface AssemblyTemplateContent {
  readonly genus: Genus;
  readonly value: DynamicValue;
}

export interface AssemblyTemplateElement {
  readonly node: string;
  readonly props?: Readonly<Record<string, unknown>>;
  readonly bind?: Readonly<Record<string, string>>;
  readonly on?: Readonly<Record<string, DispatchAction>>;
  /** Накопленный индекс повтора (`[0, 2, 1]`) — структурный факт дерева, не путь к данным. */
  readonly indexPathBind?: string;
  /** Рекурсия как поведение обхода: узел вкладывает себя же, если собственные данные вложены. */
  readonly recur?: { readonly path: string; readonly into: string };
  readonly repeat?: { readonly path: string };
  readonly children?: readonly AssemblyTemplateNode[];
}

// Старая обёрточная форма `{repeat, template}` — жива рядом с полевой (`AssemblyTemplateElement`'s
// собственный `repeat`), проверяется отдельно через `isTemplateRepeat` ниже.
export interface AssemblyTemplateRepeat {
  readonly repeat: { readonly path: string };
  readonly template: AssemblyTemplateNode;
}

export type AssemblyTemplateNode = AssemblyTemplateElement | AssemblyTemplateContent | AssemblyTemplateRepeat;

export interface AssemblyTemplate {
  readonly name: string;
  readonly means: string;
  readonly tree: AssemblyTemplateElement;
  readonly providerProps?: Readonly<Record<string, unknown>>;
}

function isTemplateContent(node: AssemblyTemplateNode): node is AssemblyTemplateContent {
  return "genus" in node;
}

// Старая обёрточная форма `{repeat, template}` — жива рядом с полевой (`{repeat, ...rest}`,
// проверяется отдельно ниже через `"repeat" in node`).
function isTemplateRepeat(node: AssemblyTemplateNode): node is AssemblyTemplateRepeat {
  return "template" in node;
}

/**
 * Абсолютит путь узла относительно текущего масштаба: `""` — весь текущий узел данных, ведущий
 * `/` — уже абсолютный путь, иначе — относительный от `base` (`""` на корне, `"/sections/0"`
 * внутри первого `repeat`-элемента).
 */
export function scopedPath(base: string, path: string): string {
  return path === "" ? base : path.startsWith("/") ? path : `${base}/${path}`;
}

/** Предел взаимной рекурсии `grow`/`growAll` — почему он нужен и почему 300, см. FAQ.md. */
const MAX_ASSEMBLY_DEPTH = 300;

export function baseAssemblyOf(
  passport: GrowablePassport,
  assembly: AssemblyTemplate,
  address: string = passport.component,
  data?: unknown,
): AssemblyTree {
  const nodes: Record<NodeId, AssemblyNode> = {};
  const taken = new Set<string>();

  const declared = passport.anatomy.keys();

  const nameFor = (base: string): string => {
    for (let ordinal = 1; ; ordinal += 1) {
      const name = ordinal === 1 ? base : `${base}-${ordinal}`;
      if (!taken.has(name)) {
        taken.add(name);
        return name;
      }
    }
  };

  const addressOf = (part: string): string => (part === passport.root ? address : `${address}.${part}`);

  const scopeTemplate = (node: AssemblyTemplateNode, base: string): AssemblyTemplateNode => {
    if (isTemplateContent(node)) {
      return isDataBinding(node.value) ? { ...node, value: { path: scopedPath(base, node.value.path) } } : node;
    }

    if (isTemplateRepeat(node)) {
      return { ...node, repeat: { path: scopedPath(base, node.repeat.path) } };
    }

    if ("repeat" in node && node.repeat) {
      // Вложенный `repeat`: здесь правится только его `repeat.path`, остальное скоупится позже,
      // когда очередь дойдёт до разворота уже его самого (FAQ.md).
      return { ...node, repeat: { path: scopedPath(base, node.repeat.path) } };
    }

    const boundBind = node.bind
      ? Object.fromEntries(Object.entries(node.bind).map(([name, path]) => [name, scopedPath(base, path)]))
      : undefined;
    const boundOn = node.on
      ? Object.fromEntries(
          Object.entries(node.on).map(([domEvent, action]) => [
            domEvent,
            {
              event: {
                name: action.event.name,
                ...(action.event.context
                  ? {
                      context: Object.fromEntries(
                        Object.entries(action.event.context).map(([key, value]) => [
                          key,
                          isDataBinding(value) ? { path: scopedPath(base, value.path) } : value,
                        ]),
                      ),
                    }
                  : {}),
              },
            },
          ]),
        )
      : undefined;
    const boundChildren = "children" in node ? node.children?.map((child) => scopeTemplate(child, base)) : undefined;
    const boundRecur = "recur" in node && node.recur ? { ...node.recur, path: scopedPath(base, node.recur.path) } : undefined;

    return {
      ...node,
      ...(boundBind ? { bind: boundBind } : {}),
      ...(boundOn ? { on: boundOn } : {}),
      ...(boundChildren ? { children: boundChildren } : {}),
      ...(boundRecur ? { recur: boundRecur } : {}),
    };
  };

  // Свои `props` узла плюс, если он назвал `indexPathBind`, накопленный индекс повтора под этим
  // ключом — литеральный `number[]`, не путь `bind`.
  const propsOf = (node: { props?: Readonly<Record<string, unknown>>; indexPathBind?: string }, indexPath: readonly number[]) =>
    node.props || node.indexPathBind ? { props: { ...node.props, ...(node.indexPathBind ? { [node.indexPathBind]: indexPath } : {}) } } : {};

  // `pristine` — ещё ни разу не скоупленная форма узла, которую переиспользует `recur` на нём
  // самом; по умолчанию это сам узел. Почему нельзя брать уже скоупленный — FAQ.md.
  const grow = (
    node: AssemblyTemplateElement | AssemblyTemplateContent,
    parentId: NodeId | null,
    indexPath: readonly number[],
    base: string,
    depth: number,
    pristine: AssemblyTemplateNode = node,
  ): NodeId => {
    if (isTemplateContent(node)) {
      const id = nameFor(node.genus);

      nodes[id] = { id, genus: node.genus, value: node.value, parentId, children: [] };

      return id;
    }

    const isOwnPart = declared.includes(node.node);
    const id = nameFor(isOwnPart && node.node === passport.root ? address : node.node);
    const children: NodeId[] = [];

    nodes[id] = {
      id,
      type: isOwnPart ? addressOf(node.node) : node.node,
      parentId,
      children,
      ...propsOf(node, indexPath),
      ...(node.bind ? { bind: node.bind } : {}),
      ...(node.on ? { on: node.on } : {}),
    };

    for (const child of node.children ?? []) children.push(...growAll(child, id, indexPath, base, depth + 1));

    if (node.recur) {
      const items = resolveDataBinding(data, node.recur.path);

      if (Array.isArray(items)) {
        const targetType = declared.includes(node.recur.into) ? addressOf(node.recur.into) : node.recur.into;
        const targetId = children.find((childId) => {
          const target = nodes[childId];
          return target !== undefined && isElement(target) && target.type === targetType;
        });

        if (targetId) {
          const grown = items.flatMap((_, index) => {
            const scoped = `${node.recur!.path}/${index}`;
            return growAll(scopeTemplate(pristine, scoped), targetId, [...indexPath, index], scoped, depth + 1, pristine);
          });

          const target = nodes[targetId] as AssemblyElement;
          nodes[targetId] = { ...target, children: [...target.children, ...grown] };
        }
      }
    }

    return id;
  };

  const growAll = (
    node: AssemblyTemplateNode,
    parentId: NodeId | null,
    indexPath: readonly number[],
    base: string,
    depth: number,
    pristine: AssemblyTemplateNode = node,
  ): NodeId[] => {
    if (depth > MAX_ASSEMBLY_DEPTH) {
      const at = "node" in node ? `node "${node.node}"` : "content node";
      throw new Error(
        `assembly "${assembly.name}" grew past ${MAX_ASSEMBLY_DEPTH} levels at ${at} — a self-recursing node with ` +
          `no exit in its data, or repeat-bound data that cycles back on itself, never stops on its own`,
      );
    }

    if (isTemplateRepeat(node)) {
      const items = resolveDataBinding(data, node.repeat.path);
      if (!Array.isArray(items)) return [];

      return items.flatMap((_, index) => {
        const scoped = `${node.repeat.path}/${index}`;
        return growAll(scopeTemplate(node.template, scoped), parentId, [...indexPath, index], scoped, depth + 1, node.template);
      });
    }

    if ("repeat" in node && node.repeat) {
      const { repeat, ...template } = node;
      const items = resolveDataBinding(data, repeat.path);
      if (!Array.isArray(items)) return [];

      return items.flatMap((_, index) => {
        const scoped = `${repeat.path}/${index}`;
        return growAll(
          scopeTemplate(template as AssemblyTemplateNode, scoped),
          parentId,
          [...indexPath, index],
          scoped,
          depth + 1,
          template as AssemblyTemplateNode,
        );
      });
    }

    return [grow(node, parentId, indexPath, base, depth, pristine)];
  };

  const root = grow(assembly.tree, null, [], "", 0);

  return {
    components: {
      root,
      nodes,
      ...(assembly.providerProps ? { providerProps: assembly.providerProps } : {}),
    },
  };
}
