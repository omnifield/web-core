import { insertNode, updateNode, type AssemblyTree, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { createSignal } from "@web-core/solid";
import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it } from "vitest";

import { kitComponentRenderer } from "../src/component-registry";

const MODULE = "приветствие";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

const kit = kitComponentRenderer();

/** Дерево модуля — обычный экземпляр кнопки, собранный тем же путём, каким его собирает потребитель. */
function moduleTree(ariaLabel: string): AssemblyTree {
  return kit.instanceOf("button", { "aria-label": ariaLabel }, "base");
}

function withReference(host: AssemblyTree, registry: Registry, module: string): AssemblyTree {
  const placed = insertNode(
    host,
    registry,
    { id: "вставка", module, props: { label: "Привет" } },
    host.components.root,
  );
  if (!placed.ok) throw new Error(`узел-ссылка отвергнут механикой — ${placed.means}`);
  return placed.tree;
}

function mount(registry: Registry, tree: AssemblyTree): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <RenderTree registry={registry} tree={tree} />, host);
  return host;
}

describe("kitComponentRenderer — источник модулей доезжает до реестра", () => {
  it("ссылка на известный модуль рисуется настоящим поддеревом", () => {
    const renderer = kitComponentRenderer(undefined, {
      modules: (name) => (name === MODULE ? moduleTree("первый") : undefined),
    });

    expect(renderer.registry.moduleOf(MODULE)).toBeDefined();

    const tree = withReference(renderer.instanceOf("flow", {}, "basic"), renderer.registry, MODULE);
    const host = mount(renderer.registry, tree);

    const button = host.querySelector('[data-scope="button"][data-part="root"]');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe("Привет");
  });

  it("правка исходного модуля видна в месте вставки без перемонтирования", () => {
    const [module, setModule] = createSignal(moduleTree("первый"));
    const renderer = kitComponentRenderer(undefined, {
      modules: (name) => (name === MODULE ? module() : undefined),
    });

    const tree = withReference(renderer.instanceOf("flow", {}, "basic"), renderer.registry, MODULE);
    const host = mount(renderer.registry, tree);

    const before = host.querySelector('[data-scope="button"][data-part="root"]');
    expect(before?.getAttribute("aria-label")).toBe("первый");

    const edited = updateNode(module(), module().components.root, { props: { "aria-label": "второй" } });
    if (!edited.ok) throw new Error(`правка модуля отвергнута механикой — ${edited.means}`);
    setModule(edited.tree);

    const after = host.querySelector('[data-scope="button"][data-part="root"]');
    expect(after?.getAttribute("aria-label")).toBe("второй");
    expect(after).toBe(before);
  });

  it("ссылка на неизвестное имя даёт заглушку, а не падение", () => {
    const known = kitComponentRenderer(undefined, {
      modules: (name) => (name === MODULE ? moduleTree("первый") : undefined),
    });
    const tree = withReference(known.instanceOf("flow", {}, "basic"), known.registry, MODULE);

    const empty = kitComponentRenderer();
    expect(empty.registry.moduleOf(MODULE)).toBeUndefined();

    const host = mount(empty.registry, tree);

    expect(host.querySelector('[data-scope="button"][data-part="root"]')).toBeNull();
    expect(host.querySelector('[data-scope="flow"][data-part="root"]')).not.toBeNull();
  });
});
