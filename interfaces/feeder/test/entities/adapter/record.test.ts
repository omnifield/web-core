import { describe, expect, it } from "vitest";

import { asAdapter } from "../../../src/entities/adapter";

const rule = { id: "r1", target: "/label", from: "/name" };

describe("asAdapter", () => {
  it("своя запись проходит целиком", () => {
    const record = { root: "/data", rules: [rule], providers: { api: {} }, consumers: {} };

    expect(asAdapter(record)).toEqual(record);
  });

  it("деревья необязательны — пустая карта присутствия законна", () => {
    expect(asAdapter({ root: "", rules: [] })).toEqual({
      root: "",
      rules: [],
      extra: undefined,
      providers: {},
      consumers: {},
    });
  });

  it("правило без айди — не наша запись: тождество строки держится на нём", () => {
    expect(asAdapter({ root: "", rules: [{ target: "/label" }] })).toBeUndefined();
  });

  it("чужое содержимое отвергается, а не чинится", () => {
    expect(asAdapter({ endpoints: [], groups: [] })).toBeUndefined();
    expect(asAdapter({ root: "/data", rules: {} })).toBeUndefined();
    expect(asAdapter({ root: "", rules: [], providers: [] })).toBeUndefined();
    expect(asAdapter(null)).toBeUndefined();
  });
});
