// «Сломанные» фикстуры ниже намеренно НЕ типизированы настоящими данными — разбор в FAQ.md,
// «Тесты».

import { describe, expect, it } from "vitest";
import { checkAssemblyData } from "../src/editor/check-assembly-data.js";
import type { PassportAssembly } from "../src/engine/passport/assembly/index.js";

interface Item {
  readonly id: string;
  readonly title: string;
}

interface ListInput {
  readonly items: readonly Item[];
}

// Настоящие данные, проверенные компилятором — доказывают счастливый путь целиком.
const rows: PassportAssembly<"root" | "item", string, ListInput> = {
  name: "rows",
  means: "proof",
  tree: {
    node: "root",
    children: [{ node: "item", repeat: { path: "/items" }, bind: { value: "id", label: "title" } }],
  },
};

describe("checkAssemblyData", () => {
  it("passes clean on a real, compiler-checked assembly matching its own schema", () => {
    const data: ListInput = { items: [{ id: "a", title: "A" }] };
    expect(checkAssemblyData("list", rows, data)).toEqual([]);
  });

  it("flags a repeat.path that resolves to nothing — the untyped/JSON case tsc cannot see", () => {
    const broken: PassportAssembly<"root" | "item"> = {
      name: "rows",
      means: "proof",
      tree: { node: "root", children: [{ node: "item", repeat: { path: "/nope" }, bind: { value: "id" } }] },
    };

    const flaws = checkAssemblyData("list", broken, { items: [] });
    expect(flaws).toHaveLength(1);
    expect(flaws[0]).toMatchObject({ path: "/nope", means: expect.stringContaining("resolves to nothing") });
  });

  it("flags a repeat.path that resolves to a non-array, separately from a missing path", () => {
    const flaws = checkAssemblyData("list", rows, { items: "not-a-list" });
    expect(flaws).toHaveLength(1);
    expect(flaws[0]).toMatchObject({ path: "/items", means: expect.stringContaining("non-array") });
  });

  it("does not cascade: a bad repeat.path does not also flag every bind inside its (unreached) template", () => {
    const broken: PassportAssembly<"root" | "item"> = {
      name: "rows",
      means: "proof",
      tree: {
        node: "root",
        children: [{ node: "item", repeat: { path: "/nope" }, bind: { value: "id", label: "also-bad" } }],
      },
    };

    expect(checkAssemblyData("list", broken, { items: [] })).toHaveLength(1);
  });

  it("flags a bad bind path INSIDE a repeat, scoped to the element, not the root", () => {
    const typo: PassportAssembly<"root" | "item"> = {
      name: "rows",
      means: "proof",
      tree: {
        node: "root",
        children: [{ node: "item", repeat: { path: "/items" }, bind: { value: "id", label: "totallyNotAField" } }],
      },
    };

    const flaws = checkAssemblyData("list", typo, { items: [{ id: "a", title: "A" }] });
    expect(flaws).toHaveLength(1);
    expect(flaws[0]).toMatchObject({ path: "totallyNotAField", where: expect.stringContaining("bind.label") });
  });

  it("resolves an absolute top-level path and catches its own typo the same way", () => {
    const absolute: PassportAssembly<"root"> = { name: "single", means: "proof", tree: { node: "root", bind: { value: "/items" } } };
    expect(checkAssemblyData("list", absolute, { items: [{ id: "a", title: "A" }] })).toEqual([]);

    const brokenAbsolute: PassportAssembly<"root"> = { name: "single", means: "proof", tree: { node: "root", bind: { value: "/nope" } } };
    expect(checkAssemblyData("list", brokenAbsolute, { items: [{ id: "a", title: "A" }] })).toHaveLength(1);
  });

  it('treats the empty-string path ("whole current node") as always legal', () => {
    const whole: PassportAssembly<"root"> = { name: "whole", means: "proof", tree: { node: "root", bind: { value: "" } } };
    expect(checkAssemblyData("thing", whole, "any value at all")).toEqual([]);
  });
});
