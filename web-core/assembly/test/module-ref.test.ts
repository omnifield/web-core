// Узел-ссылка на модуль со стороны движка: за что отвечает корень чужого дерева, как ловится
// цикл между деревьями, не теряет ли правка имени дерева. Отрисовка — `module-ref.test.tsx`.
// `admits` — та же копия семантики допуска, что и в `compose.test.ts`.

import { describe, expect, it } from "vitest";

import {
  canHoldModule,
  checkTree,
  composeTree,
  createRegistry,
  insertNode,
  moduleCycleOf,
  moduleRootOf,
  modulesReferencedBy,
  removeNode,
  rootNode,
  updateNode,
  type Admission,
  type AssemblyTree,
  type ReadableComponent,
  type ReadablePart,
  type Registry,
} from "../src/index.js";

function admits(part: ReadablePart, candidate: Admission): boolean {
  const accepts = part.accepts;
  if (!accepts) return true;

  return accepts.some((allowed) => {
    if (candidate.kind === "content") {
      return allowed.kind === "content" && allowed.genus === candidate.genus;
    }
    return (
      allowed.kind === "component" &&
      (allowed.genus === undefined || candidate.genus === undefined || allowed.genus === candidate.genus) &&
      (allowed.name === undefined || allowed.name === candidate.name)
    );
  });
}

// Тип объявлен на самой фикстуре, а не подпёрт `as const` на каждом литерале: расхождение с
// формой реестра тогда видно здесь, на месте объявления, а не каскадом из глубины типа у вызова
// `createRegistry`.
const COMPONENTS: Readonly<Record<string, ReadableComponent>> = {
  grid: {
    passport: {
      component: "grid",
      genus: "component",
      anatomy: { keys: () => ["root", "cell"] },
      root: "root",
      parts: [
        { name: "root", accepts: [{ kind: "component", name: "cell" }] },
        { name: "cell", accepts: [{ kind: "component" }, { kind: "content", genus: "text" }] },
      ],
    },
    parts: {},
  },
  card: {
    passport: {
      component: "card",
      genus: "component",
      anatomy: { keys: () => ["root"] },
      root: "root",
      parts: [{ name: "root" }],
    },
    parts: {},
  },
  button: {
    passport: {
      component: "button",
      genus: "component",
      anatomy: { keys: () => ["root"] },
      root: "root",
      parts: [{ name: "root" }],
    },
    parts: {},
  },
};

/** Дерево модуля: один узел названного адреса, само дерево знает своё имя. */
function moduleTree(name: string, type: string): AssemblyTree {
  return {
    components: {
      module: name,
      root: name,
      nodes: { [name]: { id: name, type, parentId: null, children: [] } },
    },
  };
}

function registryOf(modules: Record<string, AssemblyTree>): Registry {
  return createRegistry({ admits, components: COMPONENTS, modules: (name) => modules[name] });
}

describe("moduleRootOf — модуль отвечает за вложенность корнем своего дерева", () => {
  it("корень-компонент даёт адрес", () => {
    const registry = registryOf({ promo: moduleTree("promo", "card") });
    expect(moduleRootOf(registry, "promo")).toEqual({ ok: true, type: "card" });
  });

  it("источник модуля не знает — unknown, не бросок", () => {
    expect(moduleRootOf(registryOf({}), "promo")).toEqual({ ok: false, reason: "unknown" });
  });

  it("корень-ссылка резолвится по цепочке до настоящего адреса", () => {
    const registry = registryOf({
      promo: moduleTree("promo", "card"),
      wrapper: {
        components: {
          module: "wrapper",
          root: "ref",
          nodes: { ref: { id: "ref", module: "promo", parentId: null, children: [] } },
        },
      },
    });

    expect(moduleRootOf(registry, "wrapper")).toEqual({ ok: true, type: "card" });
  });

  it("дерево без узлов — rootless, а не «неизвестен»", () => {
    const registry = registryOf({ promo: { components: { module: "promo", root: "", nodes: {} } } });
    expect(moduleRootOf(registry, "promo")).toEqual({ ok: false, reason: "rootless" });
  });

  it("цепочка корней-ссылок, замкнутая в круг, не виснет — rootless", () => {
    const left: AssemblyTree = {
      components: { module: "left", root: "r", nodes: { r: { id: "r", module: "right", parentId: null, children: [] } } },
    };
    const right: AssemblyTree = {
      components: { module: "right", root: "r", nodes: { r: { id: "r", module: "left", parentId: null, children: [] } } },
    };

    expect(moduleRootOf(registryOf({ left, right }), "left")).toEqual({ ok: false, reason: "rootless" });
  });
});

describe("canHoldModule — то же правило допуска, что и для обычного компонента", () => {
  it("часть пускает компонент — пускает и ссылку на модуль с таким корнем", () => {
    const registry = registryOf({ promo: moduleTree("promo", "card") });
    expect(canHoldModule(registry, "grid.cell", "promo")).toEqual({ allowed: true });
  });

  it("часть не пускает такой компонент — не пускает и ссылку", () => {
    const registry = registryOf({ promo: moduleTree("promo", "card") });
    const verdict = canHoldModule(registry, "grid", "promo");

    expect(verdict.allowed).toBe(false);
    if (verdict.allowed) return;
    expect(verdict.refusal).toBe("component-not-admitted");
  });

  it("модуля нет в источнике — module-unknown", () => {
    const verdict = canHoldModule(registryOf({}), "grid.cell", "promo");
    expect(verdict).toMatchObject({ allowed: false, refusal: "module-unknown" });
  });

  it("у модуля нет корня-компонента — module-rootless", () => {
    const registry = registryOf({ promo: { components: { module: "promo", root: "", nodes: {} } } });
    expect(canHoldModule(registry, "grid.cell", "promo")).toMatchObject({
      allowed: false,
      refusal: "module-rootless",
    });
  });
});

describe("insertNode — ссылка кладётся тем же вызовом, что и компонент", () => {
  it("ссылка встаёт в часть, которая её пускает", () => {
    const registry = registryOf({ promo: moduleTree("promo", "card") });
    const base = rootNode(registry, "grid") as AssemblyTree;
    const cell = insertNode(base, registry, { id: "cell", type: "grid.cell" }, "grid");
    expect(cell.ok).toBe(true);
    if (!cell.ok) return;

    const result = insertNode(
      cell.tree,
      registry,
      { id: "ref", module: "promo", props: { title: "Скидка" } },
      "cell",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tree.components.nodes.ref).toEqual({
      id: "ref",
      module: "promo",
      parentId: "cell",
      children: [],
      props: { title: "Скидка" },
    });
  });

  it("внутрь ссылки ничего не кладётся — reference-holds-nothing", () => {
    const registry = registryOf({ promo: moduleTree("promo", "card") });
    const base = rootNode(registry, "grid") as AssemblyTree;
    const cell = insertNode(base, registry, { id: "cell", type: "grid.cell" }, "grid");
    if (!cell.ok) throw new Error("не легла ячейка");
    const ref = insertNode(cell.tree, registry, { id: "ref", module: "promo" }, "cell");
    if (!ref.ok) throw new Error("не легла ссылка");

    expect(insertNode(ref.tree, registry, { id: "inner", type: "card" }, "ref")).toMatchObject({
      ok: false,
      refusal: "reference-holds-nothing",
    });
  });

  it("значение ссылке не правится, пропы — правятся", () => {
    const registry = registryOf({ promo: moduleTree("promo", "card") });
    const base = rootNode(registry, "grid") as AssemblyTree;
    const cell = insertNode(base, registry, { id: "cell", type: "grid.cell" }, "grid");
    if (!cell.ok) throw new Error("не легла ячейка");
    const ref = insertNode(cell.tree, registry, { id: "ref", module: "promo" }, "cell");
    if (!ref.ok) throw new Error("не легла ссылка");

    expect(updateNode(ref.tree, "ref", { value: "текст" })).toMatchObject({
      ok: false,
      refusal: "patch-not-of-node",
    });

    const patched = updateNode(ref.tree, "ref", { props: { title: "Другой" } });
    expect(patched.ok).toBe(true);
    if (!patched.ok) return;
    expect(patched.tree.components.nodes.ref).toMatchObject({ props: { title: "Другой" } });
  });
});

describe("Цикл между деревьями — отказ на вставке, как на рынке", () => {
  it("модуль в самого себя — module-cycle, путь назван", () => {
    const promo = moduleTree("promo", "card");
    const registry = registryOf({ promo });

    const withCell = insertNode(
      { components: { ...promo.components, nodes: { ...promo.components.nodes } } },
      registry,
      { id: "cell", type: "card" },
      "promo",
    );
    if (!withCell.ok) throw new Error("не лёг узел");

    const result = insertNode(withCell.tree, registry, { id: "ref", module: "promo" }, "cell");
    expect(result).toMatchObject({ ok: false, refusal: "module-cycle" });
    if (result.ok) return;
    expect(result.means).toContain("promo → promo");
  });

  it("круг через третий модуль ловится тем же отказом", () => {
    const middle: AssemblyTree = {
      components: {
        module: "middle",
        root: "middle",
        nodes: {
          middle: { id: "middle", type: "grid.cell", parentId: null, children: ["inner"] },
          inner: { id: "inner", module: "outer", parentId: "middle", children: [] },
        },
      },
    };
    const outer: AssemblyTree = {
      components: {
        module: "outer",
        root: "outer",
        nodes: { outer: { id: "outer", type: "grid.cell", parentId: null, children: [] } },
      },
    };

    const registry = registryOf({ middle, outer });
    const result = insertNode(outer, registry, { id: "ref", module: "middle" }, "outer");

    expect(result).toMatchObject({ ok: false, refusal: "module-cycle" });
    if (result.ok) return;
    expect(result.means).toContain("outer → middle → outer");
  });

  it("дерево без имени — цикл вычислять не по чему, вставка проходит (ловит гвард отрисовки)", () => {
    const promo: AssemblyTree = {
      components: {
        root: "promo",
        nodes: { promo: { id: "promo", type: "grid.cell", parentId: null, children: [] } },
      },
    };

    expect(insertNode(promo, registryOf({ promo }), { id: "ref", module: "promo" }, "promo").ok).toBe(true);
  });

  it("moduleCycleOf/modulesReferencedBy читают граф ссылок без правок", () => {
    const registry = registryOf({
      promo: {
        components: {
          module: "promo",
          root: "promo",
          nodes: {
            promo: { id: "promo", type: "grid.cell", parentId: null, children: ["a", "b"] },
            a: { id: "a", module: "hero", parentId: "promo", children: [] },
            b: { id: "b", module: "hero", parentId: "promo", children: [] },
          },
        },
      },
      hero: moduleTree("hero", "card"),
    });

    // Две ссылки на один модуль — ребро графа одно, не два.
    expect(modulesReferencedBy(registry.moduleOf("promo") as AssemblyTree)).toEqual(["hero"]);
    // hero внутрь promo — законно: promo уже ссылается на hero, круга это не даёт.
    expect(moduleCycleOf(registry, "promo", "hero")).toBeUndefined();
    // promo внутрь hero — круг: promo → hero → promo.
    expect(moduleCycleOf(registry, "hero", "promo")).toEqual(["promo", "hero"]);
    expect(moduleCycleOf(registry, "promo", "promo")).toEqual(["promo"]);
  });
});

describe("Имя дерева и целостность", () => {
  it("правка узлов не теряет имени дерева — иначе цикл перестал бы вычисляться со второй правки", () => {
    const registry = registryOf({ promo: moduleTree("promo", "card") });
    const promo = moduleTree("promo", "grid");

    const added = insertNode(promo, registry, { id: "cell", type: "grid.cell" }, "promo");
    if (!added.ok) throw new Error("не лёг узел");
    expect(added.tree.components.module).toBe("promo");

    const removed = removeNode(added.tree, "cell");
    if (!removed.ok) throw new Error("не удалился узел");
    expect(removed.tree.components.module).toBe("promo");
  });

  it("checkTree называет детей у ссылки изъяном", () => {
    const flaws = checkTree({
      components: {
        root: "grid",
        nodes: {
          grid: { id: "grid", type: "grid", parentId: null, children: ["ref"] },
          ref: { id: "ref", module: "promo", parentId: "grid", children: ["kid"] as never },
          kid: { id: "kid", type: "card", parentId: "ref", children: [] },
        },
      },
    });

    expect(flaws.map((flaw) => flaw.flaw)).toContain("reference-with-children");
  });
});

describe("composeTree — ссылка узлом спеки", () => {
  it("модуль из модулей собирается одним вызовом, ветка ссылки не растится", () => {
    const registry = registryOf({ promo: moduleTree("promo", "card") });

    const result = composeTree(registry, {
      type: "grid",
      children: [{ type: "grid.cell", children: [{ module: "promo", bind: { title: "/product/name" } }] }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tree.components.nodes["grid.cell.promo"]).toEqual({
      id: "grid.cell.promo",
      module: "promo",
      parentId: "grid.cell",
      children: [],
      bind: { title: "/product/name" },
    });
  });

  it("неизвестный модуль — отказ в общем списке, соседние ветки собираются", () => {
    const registry = registryOf({ promo: moduleTree("promo", "card") });

    const result = composeTree(registry, {
      type: "grid",
      children: [
        { type: "grid.cell", children: [{ module: "missing" }] },
        { type: "grid.cell", children: [{ module: "promo" }] },
      ],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.refusals).toHaveLength(1);
    expect(result.refusals[0]).toMatchObject({ refusal: "module-unknown" });
  });
});
