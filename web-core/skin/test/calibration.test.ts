import { describe, expect, it } from "vitest";

import { checkCalibration } from "../src/engine/index.js";
import type { SkinVariables } from "../src/engine/recipe/index.js";

function variables(dimensions: SkinVariables["dimensions"]): SkinVariables {
  return { scales: {}, dimensions } as SkinVariables;
}

describe("checkCalibration — отклонение семени от рыночной опоры", () => {
  it("палитра на опорах молчит целиком", () => {
    const offsets = checkCalibration(
      variables({ space: "0.25rem", "font-size": "1rem", radius: "0.5rem", density: "1", tracking: "0em" }),
    );

    expect(offsets).toEqual([]);
  });

  it("литеральное семя называет, во сколько раз оно ушло", () => {
    const [offset, ...rest] = checkCalibration(variables({ space: "0.5rem" }));

    expect(rest).toEqual([]);
    expect(offset).toMatchObject({ seed: "space", value: 0.5, reference: 0.25, times: 2, unit: "rem" });
    expect(offset?.pole).toBeUndefined();
    expect(offset?.means).toContain("2.00×");
    expect(offset?.market).toContain("2026-09-23"); // след сверки от зоны значений, с датой
  });

  it("у текучего семени меряются оба полюса — уход может быть разным на краях", () => {
    const offsets = checkCalibration(
      variables({ space: { narrow: "0.375rem", wide: "0.5rem", between: ["360px", "1280px"] } }),
    );

    expect(offsets.map((offset) => [offset.pole, offset.times])).toEqual([
      ["narrow", 1.5],
      ["wide", 2],
    ]);
  });

  it("безразмерный множитель (плотность) меряется тем же приёмом, без единицы", () => {
    const [offset] = checkCalibration(variables({ density: "0.8" }));

    expect(offset).toMatchObject({ seed: "density", value: 0.8, reference: 1, times: 0.8 });
  });

  it("опора-ноль (трекинг) даёт находку без отношения — «во сколько раз» там не существует", () => {
    const [offset] = checkCalibration(variables({ tracking: "0.02em" }));

    expect(offset).toMatchObject({ seed: "tracking", value: 0.02, reference: 0, times: null });
    expect(offset?.means).toContain("ноль");
  });

  it("имя вне осей и значение не в единице оси проверка молча пропускает — о них говорят другие", () => {
    expect(checkCalibration(variables({ "not-an-axis": "3rem" }))).toEqual([]);
    expect(checkCalibration(variables({ space: "8px" }))).toEqual([]);
  });
});
