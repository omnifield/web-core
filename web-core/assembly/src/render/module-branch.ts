// см. README.md / FAQ.md

import { createContext, createMemo, useContext } from "solid-js";

import type { Registry } from "../engine/registry.js";
import { isReference, type AssemblyNode, type AssemblyTree } from "../engine/tree.js";
import { note } from "../shared/trace.js";

/** Имена модулей, уже подставленных ВЫШЕ по этой ветке отрисовки. Внутренний контекст, не проп:
 * потребителю это знание не принадлежит, а прокидывать его руками через каждый уровень значило бы
 * сделать глубину вложенности частью публичного контракта. */
const ModuleStack = createContext<readonly string[]>([]);

export const ModuleStackProvider = ModuleStack.Provider;

export function useModuleStack(): readonly string[] {
  return useContext(ModuleStack);
}

export type ModuleBranch =
  | { readonly kind: "tree"; readonly tree: AssemblyTree; readonly stack: readonly string[] }
  | { readonly kind: "unknown"; readonly module: string }
  | { readonly kind: "cycle"; readonly module: string };

/**
 * Дерево, подставляемое на месте узла-ссылки. Источник модулей читается ВНУТРИ мемо — отсюда
 * живость; гвард по стеку имён — вторая линия защиты от круга, первая стоит на вставке
 * (`module-cycle`, `engine/edits.ts`). Разбор обоих решений — FAQ.md.
 */
export function createModuleBranch(
  registry: () => Registry,
  node: () => AssemblyNode | undefined,
  stack: () => readonly string[],
) {
  const moduleBranch = createMemo((): ModuleBranch | undefined => {
    const current = node();
    if (!current || !isReference(current)) return undefined;

    const outer = stack();
    if (outer.includes(current.module)) return { kind: "cycle", module: current.module };

    const tree = registry().moduleOf(current.module);
    if (!tree) return { kind: "unknown", module: current.module };

    return { kind: "tree", tree, stack: [...outer, current.module] };
  });

  return moduleBranch;
}

export function noteModuleCycle(module: string, stack: readonly string[]): void {
  note(`ссылка на модуль «${module}» замыкает круг (${[...stack, module].join(" → ")}) — ветка не рисуется`);
}
