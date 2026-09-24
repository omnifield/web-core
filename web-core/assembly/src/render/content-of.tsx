// см. README.md / FAQ.md

import { type Component, createMemo, createRoot, For, getOwner, onCleanup, runWithOwner, untrack, type JSX } from "@web-core/solid";

import { isElement, type AssemblyNode, type NodeId } from "../engine/tree.js";
import { takesContent } from "./takes-content.js";
import type { RenderNodeProps } from "./types.js";

/**
 * Дети узла — объявленные в дереве (`<For>`), живой контент слота или `null`. `RenderNode`
 * приходит аргументом, не импортом: рекурсию собирает `render-node.tsx`.
 *
 * `declared` снаружи мемо, `untrack` на снимке структуры, `createRoot` вокруг `<For>`, два
 * критерия null-vs-`<For>` — каждое чинило свой баг реактивности (FAQ.md, «Отрисовка и Solid»).
 */
export function createContentOf(
  props: RenderNodeProps,
  node: () => AssemblyNode | undefined,
  ownProps: () => Record<string, unknown>,
  RenderNode: Component<RenderNodeProps>,
): () => JSX.Element | null {
  const contentCache: { memo?: () => JSX.Element | null; context?: unknown } = {};
  // Только получатель финального `dispose` («узел размонтирован НАВСЕГДА»), не владелец
  // рендера/контекста для `<For>` — почему так, см. FAQ.md.
  const lifetimeOwner = getOwner();
  let currentDispose: (() => void) | undefined;
  if (lifetimeOwner) runWithOwner(lifetimeOwner, () => onCleanup(() => currentDispose?.()));

  return function contentOf(): JSX.Element | null {
    // Приватное поле Solid: объект контекстов текущей цепочки владельцев. Сравнение по ССЫЛКЕ
    // ловит «между двумя вызовами появился или исчез провайдер» — кэш обязан перестроиться, иначе
    // дети несут владельца от прежней обёртки. Почему именно `.context`, а не `Owner` — FAQ.md.
    const callerContext = (getOwner() as { context?: unknown } | null)?.context;
    if (!contentCache.memo || contentCache.context !== callerContext) {
      currentDispose?.();
      contentCache.context = callerContext;
      const current = untrack(node);
      const declared =
        !current || !isElement(current) || !takesContent(props.registry, current.type) ? null : (
          createRoot((dispose) => {
            currentDispose = dispose;
            return (
              <For each={(node()?.children ?? []) as readonly NodeId[]}>
                {(childId) => (
                  <RenderNode
                    nodeId={childId}
                    tree={props.tree}
                    registry={props.registry}
                    fallback={props.fallback}
                    errorFallback={props.errorFallback}
                    editOverlay={props.editOverlay}
                    data={props.data}
                    dispatch={props.dispatch}
                    slots={props.slots}
                  />
                )}
              </For>
            );
          })
        );

      contentCache.memo = createMemo(() => {
        const cur = node();
        if (!cur) return null;

        const entry = isElement(cur) ? props.slots?.[cur.type] : undefined;
        if (!entry) return cur.children.length === 0 ? null : declared;

        const rendered = entry.render(ownProps());
        const placement = entry.placement ?? "replace";
        if (placement === "before") return <>{rendered}{declared}</>;
        if (placement === "after") return <>{declared}{rendered}</>;
        return rendered;
      });
    }
    return contentCache.memo();
  };
}
