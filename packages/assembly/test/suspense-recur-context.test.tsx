// Отклонённая гипотеза «виноват общий `<Suspense>` вокруг всего дерева»: сиблинг подвешивает
// барьер через `createResource` ровно в тот тик, когда содержимое растит первого `recur`-ребёнка
// — контекст доезжает и после резюме. Зачем такие пробы живут в репозитории — FAQ.md.

import { createContext, createResource, createSignal, Show, useContext, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createRegistry, type AssemblyTree, type Registry } from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

const Ctx = createContext<string>();

/** Провайдер ВСЕГДА, не только у ветки — так проба изолирует suspense и не смешивает его со
 * сменой обёртки, которую держит отдельная проба (`nested-provider-lazy-open.test.tsx`). */
function LevelItem(props: { children?: JSX.Element; [key: string]: unknown }) {
  const id = () => String(props["data-node"] ?? "?");
  return (
    <Ctx.Provider value={id()}>
      <div data-testid={`item-${id()}`}>{props.children}</div>
    </Ctx.Provider>
  );
}

function makeLevelContent(log: Map<string, string>) {
  return function LevelContent(props: { children?: JSX.Element; [key: string]: unknown }) {
    const value = useContext(Ctx);
    log.set(String(props["data-node"] ?? "?"), value ?? "ORPHAN");
    return <div data-testid={`content-${String(props["data-node"])}`}>{props.children}</div>;
  };
}

/** Аналог `TreeControlIndicator`: рисует что-то реальное ТОЛЬКО когда узел — ветка, и это "что-то"
 * — настоящий async-resource (аналог `Icon`), подвешивающий ближайший `<Suspense>`. */
function IndicatorInner() {
  const [resource] = createResource(
    () => true,
    () => new Promise<string>((resolve) => setTimeout(() => resolve("icon"), 10)),
  );
  return <Show when={resource()}>{(value) => <span data-testid="icon">{value()}</span>}</Show>;
}

function LevelIndicator(props: { [key: string]: unknown }) {
  const isBranch = () => Boolean(props["data-is-branch"]);
  return (
    <Show when={isBranch()}>
      <IndicatorInner />
    </Show>
  );
}

let dispose: (() => void) | undefined;
afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("общий <Suspense> у RenderTree + async-сиблинг, подвешенный РОВНО в момент роста recur", () => {
  it("content, чей recur-ребёнок появился в тот же тик, что и suspense от indicator, не теряет provider после резюме", async () => {
    const log = new Map<string, string>();
    const REGISTRY: Registry = createRegistry({
      components: {
        level: {
          passport: {
            component: "level",
            genus: "component",
            anatomy: { keys: () => ["item", "content", "indicator"] },
            root: "item",
            parts: [{ name: "item" }, { name: "content" }, { name: "indicator" }],
          },
          parts: { item: LevelItem, content: makeLevelContent(log), indicator: LevelIndicator },
        },
      },
      admits: () => true,
    });

    const treeAt = (isBranch: boolean): AssemblyTree => ({
      components: {
        root: "item-1",
        nodes: {
          "item-1": {
            id: "item-1",
            type: "level",
            parentId: null,
            children: ["content-1", "indicator-1"],
          },
          "content-1": {
            id: "content-1",
            type: "level.content",
            parentId: "item-1",
            children: isBranch ? ["item-2"] : [],
          },
          "indicator-1": {
            id: "indicator-1",
            type: "level.indicator",
            parentId: "item-1",
            children: [],
            props: { "data-is-branch": isBranch },
          },
          ...(isBranch
            ? {
                "item-2": { id: "item-2", type: "level", parentId: "content-1", children: ["content-2"] },
                "content-2": { id: "content-2", type: "level.content", parentId: "item-2", children: [] },
              }
            : {}),
        },
      },
    });

    const [tree, setTree] = createSignal<AssemblyTree>(treeAt(false));
    const errors: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <RenderTree
          registry={REGISTRY}
          tree={tree()}
          errorFallback={(p) => {
            errors.push(p.error);
            return null;
          }}
        />
      ),
      host,
    );

    expect(host.querySelector('[data-testid="item-item-1"]')).not.toBeNull();
    expect(log.get("content-1")).toBe("item-1");

    // Лист → ветка ОДНИМ обновлением: recur даёт первого ребёнка content-у И indicator включает
    // свой async-resource — та же одновременность, что в живом tree-view.
    setTree(treeAt(true));

    // Ждём, пока resource резолвится и Suspense резюмируется.
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(errors).toEqual([]);
    expect(host.querySelector('[data-testid="icon"]')?.textContent).toBe("icon");
    expect(log.get("content-1")).toBe("item-1");
  });
});
