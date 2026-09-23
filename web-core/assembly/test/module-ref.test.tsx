// Узел-ссылка на модуль со стороны отрисовки: подстановка чужого дерева, живость правки и гвард
// круга. Компоненты синтетические — предмет пробы механика, а не разметка кита; источник модулей
// читает сигнал, откуда и берётся живость (FAQ.md).

import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createRegistry, type AssemblyTree, type Registry } from "../src/index.js";
import { RenderTree } from "../src/render/index.jsx";

const Box = (props: { children?: unknown; label?: string }) => (
  <div data-testid="box" data-label={props.label}>
    {props.children as never}
  </div>
);

function registryOf(modules: () => Record<string, AssemblyTree>): Registry {
  return createRegistry({
    admits: () => true,
    modules: (name) => modules()[name],
    components: {
      page: {
        passport: {
          component: "page",
          genus: "component",
          anatomy: { keys: () => ["root", "slot"] },
          root: "root",
          parts: [{ name: "root" }, { name: "slot" }],
        },
        parts: { root: Box, slot: Box },
      },
      promo: {
        passport: {
          component: "promo",
          genus: "component",
          anatomy: { keys: () => ["root"] },
          root: "root",
          parts: [{ name: "root" }],
        },
        parts: { root: Box },
      },
    },
  });
}

/** Модуль «promo» — один узел с подписью из своих данных. */
function promoModule(label: string): AssemblyTree {
  return {
    components: {
      module: "promo",
      root: "promo",
      nodes: {
        promo: { id: "promo", type: "promo", parentId: null, children: ["text"], props: { label } },
        text: { id: "text", genus: "text", value: label, parentId: "promo", children: [] },
      },
    },
  };
}

/** Страница с двумя ссылками на ОДИН модуль — по ним и видно, что ссылка живая, а не копия. */
const PAGE: AssemblyTree = {
  components: {
    module: "page",
    root: "root",
    nodes: {
      root: { id: "root", type: "page", parentId: null, children: ["left", "right"] },
      left: { id: "left", module: "promo", parentId: "root", children: [] },
      right: { id: "right", module: "promo", parentId: "root", children: [] },
    },
  },
};

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(tree: AssemblyTree, registry: Registry, data?: unknown) {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <RenderTree registry={registry} tree={tree} data={data} />, host);
  return host;
}

describe("Узел-ссылка на модуль — подстановка чужого дерева, не его копия", () => {
  it("на месте ссылки рисуется дерево модуля, обе площадки одинаковы", () => {
    const host = mount(PAGE, registryOf(() => ({ promo: promoModule("Скидка") })));

    const drawn = [...host.querySelectorAll('[data-label="Скидка"]')];
    expect(drawn).toHaveLength(2);
    expect(host.textContent).toBe("СкидкаСкидка");
  });

  it("правка исходного модуля видна ВСЮДУ, где он вставлен — без пересборки страницы", () => {
    const [modules, setModules] = createSignal({ promo: promoModule("Скидка") });
    // Живой источник модулей и есть предмет пробы: читает его мемо отрисовки, не эта строка.
    // eslint-disable-next-line solid/reactivity -- см. строку выше
    const host = mount(PAGE, registryOf(() => modules()));

    expect(host.textContent).toBe("СкидкаСкидка");

    setModules({ promo: promoModule("Распродажа") });

    expect(host.textContent).toBe("РаспродажаРаспродажа");
    expect(host.querySelectorAll('[data-label="Распродажа"]')).toHaveLength(2);
  });

  it("модуль, которого источник ещё не знает, — запасной вид, а не падение; появился — дорисовывается", () => {
    const [modules, setModules] = createSignal<Record<string, AssemblyTree>>({});
    // Живой источник модулей и есть предмет пробы: читает его мемо отрисовки, не эта строка.
    // eslint-disable-next-line solid/reactivity -- см. строку выше
    const host = mount(PAGE, registryOf(() => modules()));

    expect(host.textContent).toBe("");

    setModules({ promo: promoModule("Скидка") });

    expect(host.textContent).toBe("СкидкаСкидка");
  });

  it("данные подставленному дереву даёт узел-ссылка — свои props/bind на каждой площадке", () => {
    const bound: AssemblyTree = {
      components: {
        module: "page",
        root: "root",
        nodes: {
          root: { id: "root", type: "page", parentId: null, children: ["left", "right"] },
          left: { id: "left", module: "promo", parentId: "root", props: { label: "Слева" }, children: [] },
          right: { id: "right", module: "promo", parentId: "root", bind: { label: "/title" }, children: [] },
        },
      },
    };

    const module: AssemblyTree = {
      components: {
        module: "promo",
        root: "promo",
        nodes: {
          promo: { id: "promo", type: "promo", parentId: null, children: ["text"], bind: { label: "/label" } },
          text: { id: "text", genus: "text", value: { path: "/label" }, parentId: "promo", children: [] },
        },
      },
    };

    const host = mount(bound, registryOf(() => ({ promo: module })), { title: "Справа" });

    expect(host.textContent).toBe("СлеваСправа");
  });

  it("круг между деревьями не вешает отрисовку — ветка не рисуется, остальное живо", () => {
    // Дерево пришло с уже замкнутым кругом (из файла, из сети, от старого редактора): вставка
    // такой ссылки отказала бы `module-cycle`, но нарисовать это дерево всё равно должны — без
    // бесконечной рекурсии.
    const cyclic: AssemblyTree = {
      components: {
        module: "promo",
        root: "promo",
        nodes: {
          promo: { id: "promo", type: "promo", parentId: null, children: ["text", "self"], props: { label: "Круг" } },
          text: { id: "text", genus: "text", value: "Круг", parentId: "promo", children: [] },
          self: { id: "self", module: "promo", parentId: "promo", children: [] },
        },
      },
    };

    const host = mount(PAGE, registryOf(() => ({ promo: cyclic })));

    // Первая подстановка нарисована, вторая (она же — круг) остановлена гвардом.
    expect(host.textContent).toBe("КругКруг");
    expect(host.querySelectorAll('[data-label="Круг"]')).toHaveLength(2);
  });
});
