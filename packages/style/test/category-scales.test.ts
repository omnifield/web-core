import { describe, expect, it } from "vitest";

import { AA_TEXT, contrastRatio } from "../src/engine/color/contrast.js";
import { OKLAB_JND, deltaEok } from "../src/engine/color/distance.js";
import { parseColor } from "../src/engine/color/parse.js";
import {
  CATEGORY_NO_TELLING,
  CATEGORY_SLOTS,
  CATEGORY_TELLING,
  SCALE_STEPS,
  type ScaleKey,
  type ScaleMode,
  buildCategoryScales,
  buildScale,
} from "../src/engine/scale.js";

// Семена нарочно краевые: серое (нечего разводить по оттенку), почти чёрное и почти белое
// (светлота упирается в потолок), насыщенные тёплое и холодное.
const SEEDS = ["#0f6fde", "#8b8b8b", "#e11d48", "#1a1a1a", "#f5c518"];
const MODES: ScaleMode[] = ["light", "dark"];

const pairs = <T>(items: readonly T[]): [T, T][] =>
  items.flatMap((first, index) => items.slice(index + 1).map((second): [T, T] => [first, second]));

describe("категорийные слоты — семь шкал из одного семени", () => {
  it.each(MODES)("в режиме %s слотов ровно CATEGORY_SLOTS", (mode) => {
    for (const seed of SEEDS) {
      expect(buildCategoryScales(seed, mode)).toHaveLength(CATEGORY_SLOTS);
    }
  });

  it.each(MODES)("каждый слот в режиме %s — полная шкала, а не плоское значение", (mode) => {
    for (const scale of buildCategoryScales("#0f6fde", mode)) {
      for (const step of SCALE_STEPS) expect(scale[`${step}` as ScaleKey]).toMatch(/^oklch\(/);
      expect(scale.contrast).toMatch(/^oklch\(/);
    }
  });

  it("первый слот берёт оттенок семени, остальные разведены по кругу равным шагом", () => {
    const seed = "#0f6fde";
    const hues = buildCategoryScales(seed, "light").map((scale) => parseColor(scale["9"]).h);
    const expected = Array.from(
      { length: CATEGORY_SLOTS },
      (_, index) => (parseColor(seed).h + (360 / CATEGORY_SLOTS) * index) % 360,
    );

    expect(hues[0]).toBeCloseTo(expected[0], 1);
    for (let index = 1; index < CATEGORY_SLOTS; index += 1) {
      expect(hues[index]).toBeCloseTo(expected[index], 1);
    }
  });

  it("оттенок слота не зависит от того, каким режимом построена шкала", () => {
    const light = buildCategoryScales("#0f6fde", "light").map((scale) => parseColor(scale["9"]).h);
    const dark = buildCategoryScales("#0f6fde", "dark").map((scale) => parseColor(scale["9"]).h);

    for (let index = 0; index < CATEGORY_SLOTS; index += 1) {
      expect(dark[index]).toBeCloseTo(light[index], 1);
    }
  });
});

describe("различимость — обещана там, где объявлена, и нигде больше", () => {
  it.each(CATEGORY_TELLING)("на ступени %s любые два слота расходятся не меньше JND", (step) => {
    for (const mode of MODES) {
      for (const seed of SEEDS) {
        const scales = buildCategoryScales(seed, mode);

        for (const [first, second] of pairs(scales)) {
          expect(
            deltaEok(first[step], second[step]),
            `семя ${seed}, режим ${mode}, ступень ${step}`,
          ).toBeGreaterThanOrEqual(OKLAB_JND);
        }
      }
    }
  });

  it("ступени без обещания названы поимённо — молчание читалось бы как обещание", () => {
    expect(new Set(Object.keys(CATEGORY_NO_TELLING))).toEqual(
      new Set(["1-5", "10", "12", "contrast"]),
    );

    const telling = new Set<string>(CATEGORY_TELLING);
    for (const step of ["1", "2", "3", "4", "5", "10", "12", "contrast"]) {
      expect(telling.has(step), `ступень ${step} не может быть и обещана, и снята`).toBe(false);
    }
  });

  it("фон категории и правда не различает слоты — оговорка про 1–5 не перестраховка", () => {
    const scales = buildCategoryScales("#0f6fde", "light");
    const worst = Math.min(...pairs(scales).map(([a, b]) => deltaEok(a["2"], b["2"])));

    expect(worst).toBeLessThan(OKLAB_JND);
  });

  it("семя без цветности даёт те же различимые слоты, что насыщенное", () => {
    const grey = buildCategoryScales("#8b8b8b", "light");
    const vivid = buildCategoryScales("#e11d48", "light");

    for (const step of CATEGORY_TELLING) {
      const greyWorst = Math.min(...pairs(grey).map(([a, b]) => deltaEok(a[step], b[step])));
      const vividWorst = Math.min(...pairs(vivid).map(([a, b]) => deltaEok(a[step], b[step])));

      expect(greyWorst).toBeGreaterThanOrEqual(OKLAB_JND);
      expect(greyWorst).toBeCloseTo(vividWorst, 1);
    }
  });
});

describe("обещания шкалы держатся и на категорийном слоте", () => {
  it.each(MODES)("в режиме %s текст 11 читается на фонах 1, 2 и 3", (mode) => {
    for (const seed of SEEDS) {
      for (const scale of buildCategoryScales(seed, mode)) {
        for (const background of ["1", "2", "3"] as ScaleKey[]) {
          expect(
            contrastRatio(scale["11"], scale[background]),
            `семя ${seed}, режим ${mode}, фон ${background}`,
          ).toBeGreaterThanOrEqual(AA_TEXT);
        }
      }
    }
  });

  it.each(MODES)("в режиме %s рамка 7 отделяется от фона 2 внутри своего слота", (mode) => {
    for (const scale of buildCategoryScales("#0f6fde", mode)) {
      expect(deltaEok(scale["7"], scale["2"])).toBeGreaterThanOrEqual(OKLAB_JND);
    }
  });

  it("слот строится тем же buildScale, что и обычная шкала — ступени не пересчитаны заново", () => {
    const [first] = buildCategoryScales("#0f6fde", "light");
    const seed = parseColor("#0f6fde");
    const direct = buildScale({ l: seed.l, c: 0.15, h: seed.h }, "light");

    expect(first).toEqual(direct);
  });
});
