// Слот живого контента на месте узла: три размещения, резолвленные пропы, отсутствие регрессии
// без слотов. Компоненты синтетические, дерево собрано литералом — предмет пробы вход
// `RenderTree.slots`, а не разметка кита и не разворот шаблона.

import { createContext, useContext } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import {
  createRegistry,
  type AssemblyTree,
  type Registry,
} from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

/** Обёртка с меткой в разметке: по ней видно, что узел РЕАЛЬНО резолвился реестром, а не был
 * обойдён слотом — слот меняет только содержимое, никогда сам узел. */
const Wrapper = (props: { children?: unknown; "data-static"?: string; variant?: string }) => (
  <div data-testid="wrapper" data-static={props["data-static"]} data-variant={props.variant}>
    {props.children as never}
  </div>
);

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
      parts: { root: Wrapper, content: Wrapper },
    },
  },
  admits: () => true,
});

/** Дерево: корень — обёртка, единственный ребёнок — узел `widget.content`, куда встаёт слот. */
function treeWith(children: AssemblyTree["components"]["nodes"][string]["children"]): AssemblyTree {
  return {
    components: {
      root: "root",
      nodes: {
        root: { id: "root", type: "widget", parentId: null, children: ["content"] },
        content: {
          id: "content",
          type: "widget.content",
          parentId: "root",
          children,
          props: { "data-static": "literal" },
          bind: { variant: "/variant" },
        },
        text: { id: "text", genus: "text", value: "declared", parentId: "content", children: [] },
      },
    },
  };
}

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(
  tree: AssemblyTree,
  slots: Parameters<typeof RenderTree>[0]["slots"],
  registry: Registry = REGISTRY,
) {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => <RenderTree registry={registry} tree={tree} data={{ variant: "s1" }} slots={slots} />,
    host,
  );
  return host;
}

describe("RenderTree slots — контент узла сверху, узел резолвится как обычно", () => {
  it('placement "replace" (умолчание) — слот замещает ПУСТЫХ детей, обёртка узла реально вызвана', () => {
    const host = mount(treeWith([]), {
      "widget.content": { render: () => <span data-testid="slot">SLOT</span> },
    });

    // Обёртка (`resolveComponent` дошёл до реестра, не был обойдён) — ключевая проверка находки.
    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector('[data-testid="slot"]')?.textContent).toBe("SLOT");
  });

  it('placement "before" — слот встаёт ПЕРЕД объявленными детьми', () => {
    const host = mount(treeWith(["text"]), {
      "widget.content": { render: () => <span data-testid="slot">SLOT</span>, placement: "before" },
    });

    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]')!;
    expect(wrapper.textContent).toBe("SLOTdeclared");
  });

  it('placement "after" — слот встаёт ПОСЛЕ объявленных детей', () => {
    const host = mount(treeWith(["text"]), {
      "widget.content": { render: () => <span data-testid="slot">SLOT</span>, placement: "after" },
    });

    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]')!;
    expect(wrapper.textContent).toBe("declaredSLOT");
  });

  it("слот получает резолвленные пропы узла — литерал (props) и bind вместе", () => {
    const resolved: unknown[] = [];
    mount(treeWith([]), {
      "widget.content": {
        render: (props) => {
          resolved.push(props);
          return <span data-testid="slot">SLOT</span>;
        },
      },
    });

    expect(resolved).toEqual([{ "data-static": "literal", variant: "s1" }]);
  });

  it("без совпадающего адреса в slots — дерево рисуется как раньше, регрессии нет", () => {
    const host = mount(treeWith(["text"]), { "widget.other": { render: () => <span>never</span> } });

    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]')!;
    expect(wrapper.textContent).toBe("declared");
    expect(wrapper.querySelector('[data-testid="slot"]')).toBeNull();
  });

  it("slots вовсе не задан — дерево рисуется как раньше, регрессии нет", () => {
    const host = mount(treeWith(["text"]), undefined);

    const wrapper = host.querySelector('[data-testid="wrapper"][data-static="literal"]')!;
    expect(wrapper.textContent).toBe("declared");
  });
});

/** Читает `props.children` ДВАЖДЫ — законный случай: содержимое используется в двух местах
 * разметки. Почему кэш `contentOf()` на нём не перестраивается — FAQ.md. */
const DoubleReader = (props: { children?: unknown }) => (
  <div data-testid="wrapper">
    <div data-testid="first">{props.children as never}</div>
    <div data-testid="second">{props.children as never}</div>
  </div>
);

const DOUBLE_READ_REGISTRY: Registry = createRegistry({
  components: {
    widget: {
      passport: {
        component: "widget",
        genus: "component",
        anatomy: { keys: () => ["root", "content"] },
        root: "root",
        parts: [{ name: "root" }, { name: "content" }],
      },
      parts: { root: Wrapper, content: DoubleReader },
    },
  },
  admits: () => true,
});

describe("contentOf() — ленивый мемо, а не пересборка на каждое чтение .children", () => {
  it("узел, читающий свои дети дважды, не зовёт entry.render дважды", () => {
    let calls = 0;
    const host = mount(
      treeWith([]),
      {
        "widget.content": {
          render: () => {
            calls += 1;
            return <span data-testid="slot">SLOT</span>;
          },
        },
      },
      DOUBLE_READ_REGISTRY,
    );

    // Один `<span>`, а не два: мемо отдаёт обоим чтениям одну ссылку, Solid не клонирует узел,
    // а переставляет его. Ожидание верное — кэш держит ОДИН результат.
    expect(host.querySelectorAll('[data-testid="slot"]')).toHaveLength(1);
    expect(calls).toBe(1);
  });
});

/** Контекст, поставленный предком вокруг своих `children`, обязан достаться вложенному узлу —
 * то есть дети собираются в МОМЕНТ чтения предком, не раньше. Почему мемо здесь ленивый и чем
 * это обошлось бы иначе — FAQ.md; счётчик вызовов из пробы выше этого не поймал бы. */
const NodeCtx = createContext<string>();

const CtxProvider = (props: { children?: unknown }) => (
  <NodeCtx.Provider value="from-provider">
    <div data-testid="wrapper">{props.children as never}</div>
  </NodeCtx.Provider>
);

const CtxConsumer = () => <span data-testid="consumer">{useContext(NodeCtx) ?? "MISSING"}</span>;

const CTX_REGISTRY: Registry = createRegistry({
  components: {
    provider: {
      passport: {
        component: "provider",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [{ name: "root" }],
      },
      parts: { root: CtxProvider },
    },
    consumer: {
      passport: {
        component: "consumer",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [{ name: "root" }],
      },
      parts: { root: CtxConsumer },
    },
  },
  admits: () => true,
});

const CTX_TREE: AssemblyTree = {
  components: {
    root: "root",
    nodes: {
      root: { id: "root", type: "provider", parentId: null, children: ["child"] },
      child: { id: "child", type: "consumer", parentId: "root", children: [] },
    },
  },
};

describe("contentOf() — дети собираются в момент чтения предком, а не раньше", () => {
  it("контекст предка, поставленный вокруг своих children, виден вложенному узлу", () => {
    const host = mount(CTX_TREE, undefined, CTX_REGISTRY);

    expect(host.querySelector('[data-testid="consumer"]')?.textContent).toBe("from-provider");
  });
});
