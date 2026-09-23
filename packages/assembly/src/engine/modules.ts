// см. README.md / FAQ.md

import { readAddress, type Registry } from "./registry.js";
import { isReference, rootOf, type AssemblyTree } from "./tree.js";

export type ModuleRoot =
  | { readonly ok: true; readonly type: string }
  | { readonly ok: false; readonly reason: "unknown" | "rootless" };

/** Адрес корневого узла дерева модуля — им модуль и отвечает за свою вложенность (FAQ.md).
 * Корень сам оказался ссылкой — идём по цепочке; `seen` держит её конечной на зацикленном графе. */
export function moduleRootOf(registry: Registry, module: string): ModuleRoot {
  const seen = new Set<string>();
  let name = module;

  for (;;) {
    if (seen.has(name)) return { ok: false, reason: "rootless" };
    seen.add(name);

    const tree = registry.moduleOf(name);
    if (!tree) return { ok: false, reason: "unknown" };

    const root = rootOf(tree);
    if (!root) return { ok: false, reason: "rootless" };

    if (isReference(root)) {
      name = root.module;
      continue;
    }

    if (!("type" in root)) return { ok: false, reason: "rootless" };
    if (!readAddress(registry, root.type)) return { ok: false, reason: "rootless" };

    return { ok: true, type: root.type };
  }
}

/** Имена модулей, на которые дерево ссылается напрямую — ребро графа ссылок, не вся цепочка. */
export function modulesReferencedBy(tree: AssemblyTree): string[] {
  const names: string[] = [];

  for (const node of Object.values(tree.components.nodes)) {
    if (!isReference(node) || names.includes(node.module)) continue;
    names.push(node.module);
  }

  return names;
}

/**
 * Дойдёт ли цепочка ссылок из `entry` обратно до `host` — станет ли вставка циклом. Отдаёт сам
 * путь (`[entry, …, host]`): редактору есть что показать человеку, а не голое «нельзя» (FAQ.md).
 */
export function moduleCycleOf(registry: Registry, host: string, entry: string): string[] | undefined {
  const seen = new Set<string>();

  const walk = (name: string, path: readonly string[]): string[] | undefined => {
    if (name === host) return [...path, name];
    if (seen.has(name)) return undefined;
    seen.add(name);

    const tree = registry.moduleOf(name);
    if (!tree) return undefined;

    for (const next of modulesReferencedBy(tree)) {
      const found = walk(next, [...path, name]);
      if (found) return found;
    }

    return undefined;
  };

  return walk(entry, []);
}
