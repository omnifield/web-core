import { describe, expect, it } from "vitest";

import { DERIVED_SCALES } from "../src/engine/dimension";

/** WCAG 2.2, 1.4.8 Visual Presentation (AAA) — строка не длиннее 80 знаков. */
const MEASURE_CEILING = 80;

/** Канон измерения: 45–75 знаков, идеал 66 (Bringhurst). */
const MEASURE_BAND = { floor: 45, ceiling: 75 } as const;

const COLUMN = DERIVED_SCALES.find((scale) => scale.seed === "column")!;

const CHARS = COLUMN.steps.map((step) => ("factor" in step ? step.factor : Number.NaN));

describe("ряд колонки — длина строки", () => {
  it("имя ступени равно числу знаков, иначе имя врёт", () => {
    for (const step of COLUMN.steps) {
      const declared = Number.parseInt(step.name.replace("column-", ""), 10);

      expect("factor" in step && step.factor, `ступень «${step.name}»`).toBe(declared);
    }
  });

  it("ни одна ступень не переходит потолок нормы", () => {
    for (const chars of CHARS) expect(chars).toBeLessThanOrEqual(MEASURE_CEILING);
  });

  it("в ряду есть ступень под основной текст — внутри канона измерения", () => {
    const inside = CHARS.filter((chars) => chars >= MEASURE_BAND.floor && chars <= MEASURE_BAND.ceiling);

    expect(inside, `ступени внутри ${MEASURE_BAND.floor}–${MEASURE_BAND.ceiling}: ${inside.join(", ")}`)
      .not.toHaveLength(0);
  });

  it("идеал 66 знаков зажат ступенями с двух сторон — иначе под него нечего взять", () => {
    expect(CHARS.some((chars) => chars <= 66)).toBe(true);
    expect(CHARS.some((chars) => chars >= 66)).toBe(true);
  });
});
