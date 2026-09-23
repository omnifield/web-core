// Накопленный индексный путь отдаётся автору значением. Фикстура — то же двухуровневое вложение
// повторов, что у проверки поля повтора. Разбор — FAQ.md, «Тесты».

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";

import { baseAssemblyOf, type BaseAssemblyElement } from "../src/engine/passport/assembly/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";

const anatomy = createAnatomy("list").parts("root", "section", "row");

const passport = definePassport({
  anatomy,
  root: "root",
  parts: [{ name: "root", states: [] }, { name: "section", states: [] }, { name: "row", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

const data = {
  sections: [
    { id: "s1", title: "First", rows: [{ id: "r1", title: "A" }, { id: "r2", title: "B" }] },
    { id: "s2", title: "Second", rows: [{ id: "r3", title: "C" }] },
  ],
};

const isElement = (node: unknown): node is BaseAssemblyElement =>
  typeof node === "object" && node !== null && "type" in node;

describe("indexPathBind — the repeat index growAll already counts, named as a value", () => {
  it("a node at the OUTER repeat gets its own single-element path; a node nested TWO repeats deep gets both, in order", () => {
    const tree = baseAssemblyOf(
      passport,
      {
        name: "proof",
        means: "proof",
        tree: {
          node: "root",
          children: [
            {
              node: "section",
              repeat: { path: "/sections" },
              indexPathBind: "indexPath",
              children: [{ node: "row", repeat: { path: "rows" }, indexPathBind: "indexPath" }],
            },
          ],
        },
      },
      "list",
      data,
    );

    const byType = (type: string) => (Object.values(tree.components.nodes).filter((node) => isElement(node) && node.type === type) as BaseAssemblyElement[]);

    const sections = byType("list.section");
    const rows = byType("list.row");

    expect(sections.map((section) => section.props?.["indexPath"])).toEqual([[0], [1]]);
    // Row order follows section order (s1's two rows, then s2's one) — same flatMap order
    // `repeat-field.test.ts` already relies on for its own `["A","B","C"]` assertion.
    expect(rows.map((row) => row.props?.["indexPath"])).toEqual([[0, 0], [0, 1], [1, 0]]);
  });

  it("a node outside any repeat gets an empty path, not undefined — it IS a known depth, zero", () => {
    const tree = baseAssemblyOf(
      passport,
      { name: "proof", means: "proof", tree: { node: "root", indexPathBind: "indexPath" } },
      "list",
      data,
    );

    const root = tree.components.nodes[tree.components.root] as BaseAssemblyElement;
    expect(root.props?.["indexPath"]).toEqual([]);
  });

  it("the node's own props survive alongside the computed indexPath — one does not replace the other", () => {
    const tree = baseAssemblyOf(
      passport,
      {
        name: "proof",
        means: "proof",
        tree: {
          node: "root",
          children: [{ node: "section", repeat: { path: "/sections" }, props: { role: "listitem" }, indexPathBind: "depth" }],
        },
      },
      "list",
      data,
    );

    const section = Object.values(tree.components.nodes).find((node) => isElement(node) && node.type === "list.section") as BaseAssemblyElement;

    expect(section.props).toEqual({ role: "listitem", depth: [0] });
  });

});
