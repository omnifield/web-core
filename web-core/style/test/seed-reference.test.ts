import { describe, expect, it } from "vitest";

import { AXES, axisOf } from "../src/engine/axes";
import {
  CONTROL_TARGET_MIN,
  DENSITY_FLOOR,
  DENSITY_TOKEN,
  DERIVED_SCALES,
} from "../src/engine/dimension";

const DATE = /\b\d{4}-\d{2}-\d{2}\b/;

describe("опора семени — значение, при котором ступени дают сверенные с рынком числа", () => {
  it.each(AXES.map((axis) => axis.token))("ось %s объявляет опору числом", (token) => {
    const axis = axisOf(token)!;

    expect(Number.isFinite(axis.reference.value)).toBe(true);
    expect(axis.reference.value).toBeGreaterThanOrEqual(0);
  });

  it.each(AXES.map((axis) => axis.token))("у опоры %s назван след сверки с датой", (token) => {
    const axis = axisOf(token)!;

    expect(axis.reference.market.length).toBeGreaterThan(0);
    expect(axis.reference.market, `след опоры «${token}» без даты сверки`).toMatch(DATE);
  });

  it.each(AXES.map((axis) => axis.token))("опора %s лежит между полом и потолком оси", (token) => {
    const axis = axisOf(token)!;

    if (axis.floor.value !== null) expect(axis.reference.value).toBeGreaterThanOrEqual(axis.floor.value);
    if (axis.ceiling.value !== null) expect(axis.reference.value).toBeLessThanOrEqual(axis.ceiling.value);
  });

  it("каждая шкала имеет ось с опорой — иначе её ступени не в чем считать", () => {
    for (const scale of DERIVED_SCALES) {
      expect(axisOf(scale.seed), `нет оси для семени «${scale.seed}»`).toBeDefined();
    }
  });

  it("опора контрола держит минимум цели на всём диапазоне плотности", () => {
    const control = DERIVED_SCALES.find((scale) => scale.seed === "control-height")!;
    const smallest = control.steps.find((step) => step.name === "control-height-sm")!;
    const factor = "factor" in smallest ? smallest.factor : Number.NaN;

    const atFloor = axisOf("control-height")!.reference.value * factor * DENSITY_FLOOR;

    expect(atFloor).toBeGreaterThanOrEqual(Number.parseFloat(CONTROL_TARGET_MIN.value));
  });

  it("опора плотности — единица: «сто процентов» и есть сверенный с рынком вид", () => {
    expect(axisOf(DENSITY_TOKEN)!.reference.value).toBe(1);
  });
});
