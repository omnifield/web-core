// `rootProps` — динамическое состояние показа (какой элемент активен) доезжает до живых пропов
// корня, не трогая дерево: иначе каждый клик пересобирал бы дерево целиком. Почему это состояние
// показа, а не структура — FAQ.md.

import { createSignal } from "@web-core/solid";
import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it } from "vitest";

import { createRegistry, type AssemblyTree, type Registry } from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

let contentMounts = 0;

const Root = (props: { activeValue?: string; children?: unknown }) => (
  <div data-testid="root" data-active={props.activeValue}>
    {props.children as never}
  </div>
);

/** Считает собственные монтажи — тело компонента Solid выполняется РОВНО один раз на монтаж, так
 *  что счётчик — прямое доказательство того, пересобрался узел или нет. */
const Content = () => {
  contentMounts += 1;
  return <span data-testid="content">content</span>;
};

const REGISTRY: Registry = createRegistry({
  components: {
    widget: {
      passport: {
        component: "widget",
        genus: "component",
        anatomy: { keys: () => ["root", "content"] },
        root: "root",
        parts: [{ name: "root" }, { name: "content" }],
      },
      parts: { root: Root, content: Content },
    },
  },
  admits: () => true,
});

const TREE: AssemblyTree = {
  components: {
    root: "root",
    nodes: {
      root: { id: "root", type: "widget", parentId: null, children: ["content"] },
      content: { id: "content", type: "widget.content", parentId: "root", children: [] },
    },
  },
};

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
  contentMounts = 0;
});

describe("RenderTree rootProps — динамическое состояние показа доезжает до корня, дерево не трогает", () => {
  it("смена rootProps меняет живой проп корня; ребёнок не пересоздаётся", async () => {
    const [activeValue, setActiveValue] = createSignal<string | undefined>("a");

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <RenderTree registry={REGISTRY} tree={TREE} rootProps={{ activeValue: activeValue() }} />,
      host,
    );

    expect(host.querySelector('[data-testid="root"]')?.getAttribute("data-active")).toBe("a");
    expect(contentMounts).toBe(1);

    setActiveValue("b");
    await Promise.resolve();

    expect(host.querySelector('[data-testid="root"]')?.getAttribute("data-active")).toBe("b");
    expect(contentMounts).toBe(1);
  });

  it("rootProps не задан — дерево рисуется как раньше, регрессии нет", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RenderTree registry={REGISTRY} tree={TREE} />, host);

    expect(host.querySelector('[data-testid="root"]')?.getAttribute("data-active")).toBeNull();
    expect(contentMounts).toBe(1);
  });
});
