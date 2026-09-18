import { z } from "@web-core/io";
import { describe, expect, it } from "vitest";

import {
  describeVariant,
  isSchema,
  recordPathsOf,
  rowSetsOf,
} from "../../../src/entities/mapping";

const response = {
  data: { items: [{ id: 1, name: "Аня", tags: ["a"] }] },
  total: 1,
};

describe("isSchema", () => {
  it("отличает зод-схему от сырых данных по самому значению", () => {
    expect(isSchema(z.object({ id: z.number() }))).toBe(true);
    expect(isSchema({ id: 1 })).toBe(false);
  });
});

describe("describeVariant", () => {
  it("сырые данные и схема описываются одинаковой формой", () => {
    const fromSample = describeVariant({ id: 1, name: "Аня" });
    const fromSchema = describeVariant(z.object({ id: z.number(), name: z.string() }));

    expect(fromSample.map((field) => field.path)).toEqual(["/id", "/name"]);
    expect(fromSchema.map((field) => field.path)).toEqual(["/id", "/name"]);
  });
});

describe("rowSetsOf", () => {
  it("предлагает места, похожие на набор записей", () => {
    expect(rowSetsOf(response)).toContain("/data/items");
  });

  it("у схемы кандидатов нет — сэмпла, в котором их искать, ещё не было", () => {
    expect(rowSetsOf(z.object({ id: z.number() }))).toEqual([]);
  });
});

describe("recordPathsOf", () => {
  it("пути ЗАПИСИ, а не ответа: правила пишутся на запись", () => {
    expect(recordPathsOf(response, "/data/items").map((field) => field.path)).toEqual([
      "/id",
      "/name",
      "/tags/0",
    ]);
  });

  it("одиночный объект по корню — он сам и есть запись", () => {
    expect(recordPathsOf({ id: 3, name: "Гена" }, "").map((field) => field.path)).toEqual([
      "/id",
      "/name",
    ]);
  });

  it("путь мимо — пусто, без исключения", () => {
    expect(recordPathsOf(response, "/nope")).toEqual([]);
  });
});
