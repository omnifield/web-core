import { describe, expect, it } from "vitest";

import { partnersOf, usersOf, type Adapter } from "../../../src/entities/adapter";

function adapter(providers: Record<string, unknown>, consumers: Record<string, unknown>): Adapter {
  return { root: "", rules: [], providers, consumers };
}

const card = adapter(
  { api: { "preset-7": { "endpoint-3": {}, "endpoint-9": {} } } },
  { component: { "user-card": {} } },
);

const table = adapter(
  { api: { "preset-7": { "endpoint-3": {} } } },
  { component: { table: {} } },
);

describe("usersOf", () => {
  it("перечисляет листья дерева полными путями", () => {
    expect(usersOf(card, "providers")).toEqual([
      ["api", "preset-7", "endpoint-3"],
      ["api", "preset-7", "endpoint-9"],
    ]);
    expect(usersOf(card, "consumers")).toEqual([["component", "user-card"]]);
  });

  it("пустое дерево — пустой список, а не выдумка", () => {
    expect(usersOf(adapter({}, {}), "providers")).toEqual([]);
  });
});

describe("partnersOf", () => {
  it("какие ручки связаны с этим компонентом", () => {
    const found = partnersOf([card, table], "consumers", ["component", "user-card"]);

    expect(found).toEqual([
      ["api", "preset-7", "endpoint-3"],
      ["api", "preset-7", "endpoint-9"],
    ]);
  });

  it("и обратно — какие компоненты кормит эта ручка", () => {
    const found = partnersOf([card, table], "providers", ["api", "preset-7", "endpoint-3"]);

    expect(found).toEqual([["component", "user-card"], ["component", "table"]]);
  });

  it("один и тот же партнёр из двух записей не двоится", () => {
    const twin = adapter(
      { api: { "preset-7": { "endpoint-3": {} } } },
      { component: { "user-card": {} } },
    );

    const found = partnersOf([card, twin], "consumers", ["component", "user-card"]);

    expect(found.filter((one) => one.at(-1) === "endpoint-3")).toHaveLength(1);
  });

  it("никого не нашли — пустой список", () => {
    expect(partnersOf([card], "consumers", ["component", "нет-такого"])).toEqual([]);
  });
});
