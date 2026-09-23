// Проба БЕЗ модулей и без слотов: литеральное значение content-узла при смене САМОГО дерева
// (новый объект `AssemblyTree`, те же id узлов — ровно то, что делает любая правка через
// `updateNode`). Соседняя, но отдельная от `rebuild-reactivity-repro.test.tsx`: та про `bind`,
// который резолвится из данных показа, эта — про литерал, который живёт в самом дереве.

import { createSignal } from "@web-core/solid";
import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it } from "vitest";

import { createRegistry, updateNode, type AssemblyTree, type Registry } from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

const Box = (props: { children?: unknown }) => <div data-testid="box">{props.children as never}</div>;

const REGISTRY: Registry = createRegistry({
  admits: () => true,
  components: {
    widget: {
      passport: {
        component: "widget",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [{ name: "root" }],
      },
      parts: { root: Box },
    },
  },
});

const BASE: AssemblyTree = {
  components: {
    root: "root",
    nodes: {
      root: { id: "root", type: "widget", parentId: null, children: ["text"] },
      text: { id: "text", genus: "text", value: "было", parentId: "root", children: [] },
    },
  },
};

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("Литерал содержимого при смене дерева", () => {
  it("updateNode значения доезжает до DOM, а не замирает на первом отрисованном", () => {
    const [tree, setTree] = createSignal(BASE);

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree()} />, host);

    expect(host.textContent).toBe("было");

    const edited = updateNode(BASE, "text", { value: "стало" });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    setTree(edited.tree);

    expect(host.textContent).toBe("стало");
  });
});
