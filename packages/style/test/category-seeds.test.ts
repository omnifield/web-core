import { describe, expect, it } from "vitest";

import { AA_TEXT, contrastRatio } from "../src/engine/color/contrast.js";
import { OKLAB_JND, deltaEok } from "../src/engine/color/distance.js";
import { formatOklch } from "../src/engine/color/oklch.js";
import { parseColor } from "../src/engine/color/parse.js";
import {
  CATEGORY_CHROMA,
  CATEGORY_LIGHTNESS,
  CATEGORY_NO_TELLING,
  CATEGORY_TELLING,
  CATEGORY_TELLING_LIMIT,
  buildCategorySeeds,
  buildScale,
  type ScaleKey,
  type ScaleMode,
} from "../src/engine/scale.js";

const MODES: ScaleMode[] = ["light", "dark"];

// Стартовый угол обходится по всему кругу: узкое место переезжает по оттенкам, и пять
// любимых семян его не ловят — на count 14 провал нашёлся на старте 65°, а не на них.
const STARTS = Array.from({ length: 72 }, (_, index) => index * 5);
const seedAt = (hue: number): string => formatOklch({ l: 0.5, c: 0.1, h: hue });

const ladders = (seed: string, count: number, mode: ScaleMode) =>
  buildCategorySeeds(seed, count).map((point) => buildScale(point, mode));

const worstPair = (scales: ReturnType<typeof ladders>, step: ScaleKey): number => {
  let worst = Infinity;
  for (let i = 0; i < scales.length; i += 1) {
    for (let j = i + 1; j < scales.length; j += 1) {
      worst = Math.min(worst, deltaEok(scales[i][step], scales[j][step]));
    }
  }
  return worst;
};

describe("семена категорий — точки цвета, а не готовые лесенки", () => {
  it.each([1, 2, 5, 7, 12])("для %i категорий отдаёт столько же разбираемых цветов", (count) => {
    const seeds = buildCategorySeeds("#0f6fde", count);

    expect(seeds).toHaveLength(count);
    for (const value of seeds) expect(() => parseColor(value)).not.toThrow();
  });

  it.each([0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "число категорий «%s» отвергается, а не подгоняется молча",
    (count) => {
      expect(() => buildCategorySeeds("#0f6fde", count)).toThrow(RangeError);
    },
  );

  it("первая категория стоит на оттенке семени, остальные отвёрнуты равным шагом", () => {
    const count = 7;
    const hues = buildCategorySeeds("#0f6fde", count).map((value) => parseColor(value).h);
    const start = parseColor("#0f6fde").h;

    for (let index = 0; index < count; index += 1) {
      expect(hues[index]).toBeCloseTo((start + (360 / count) * index) % 360, 1);
    }
  });

  it("светлота и цветность у всех категорий одни и те же — ни одна не весомее прочих", () => {
    for (const start of STARTS) {
      for (const value of buildCategorySeeds(seedAt(start), 7)) {
        const point = parseColor(value);

        expect(point.l).toBeCloseTo(CATEGORY_LIGHTNESS, 3);
        expect(point.c).toBeCloseTo(CATEGORY_CHROMA, 3);
      }
    }
  });

  // Стережёт найденный разбор: цветность 0.15 не существует в sRGB сразу для всех оттенков,
  // и запись в строку срезала её молча — тем сильнее, чем дальше оттенок от достижимого.
  it("заявленная цветность доживает до строки, а не срезается гамутом по дороге", () => {
    for (const start of STARTS) {
      for (const value of buildCategorySeeds(seedAt(start), 12)) {
        expect(parseColor(value).c, `семя ${value}`).toBeCloseTo(CATEGORY_CHROMA, 4);
      }
    }
  });

  it("семя не зависит от светлоты и цветности бренда — только от его оттенка", () => {
    const pale = buildCategorySeeds(formatOklch({ l: 0.2, c: 0.02, h: 240 }), 7);
    const vivid = buildCategorySeeds(formatOklch({ l: 0.9, c: 0.3, h: 240 }), 7);

    expect(pale).toEqual(vivid);
  });
});

describe("различимость — измерена по всему кругу, обещана до объявленного предела", () => {
  it.each(CATEGORY_TELLING)(
    `на ступени %s любые две категории расходятся не меньше JND — до ${CATEGORY_TELLING_LIMIT} категорий`,
    (step) => {
      for (const count of [2, 7, CATEGORY_TELLING_LIMIT]) {
        for (const mode of MODES) {
          for (const start of STARTS) {
            expect(
              worstPair(ladders(seedAt(start), count, mode), step),
              `${count} категорий, старт ${start}°, режим ${mode}, ступень ${step}`,
            ).toBeGreaterThanOrEqual(OKLAB_JND);
          }
        }
      }
    },
  );

  it("за пределом обещание и правда кончается — предел не перестраховка", () => {
    let worst = Infinity;
    for (const start of STARTS) {
      worst = Math.min(worst, worstPair(ladders(seedAt(start), 14, "light"), "6"));
    }

    expect(worst).toBeLessThan(OKLAB_JND);
  });

  it("ступени без обещания названы поимённо и не пересекаются с обещанными", () => {
    expect(new Set(Object.keys(CATEGORY_NO_TELLING))).toEqual(
      new Set(["1-5", "10", "12", "contrast"]),
    );

    const telling = new Set<string>(CATEGORY_TELLING);
    for (const step of ["1", "2", "3", "4", "5", "10", "12", "contrast"]) {
      expect(telling.has(step), `ступень ${step} не может быть и обещана, и снята`).toBe(false);
    }
  });

  it("фон категории и правда её не опознаёт — оговорка про 1–5 не перестраховка", () => {
    expect(worstPair(ladders("#0f6fde", 7, "light"), "2")).toBeLessThan(OKLAB_JND);
  });

  // Под новой моделью категория — обычная шкала палитры, и рядом с порождёнными стоят
  // объявленные руками: мера обязана работать на любой паре, а не только на своих.
  it("мера считает и пару «порождённая против объявленной руками»", () => {
    const [generated] = ladders("#0f6fde", 7, "light");
    const byHand = buildScale("#e11d48", "light");

    for (const step of CATEGORY_TELLING) {
      expect(deltaEok(generated[step], byHand[step])).toBeGreaterThan(0);
    }
    expect(deltaEok(byHand["9"], byHand["9"])).toBe(0);
  });
});

describe("обещания обычной шкалы держатся на категорийном семени", () => {
  it.each(MODES)("в режиме %s текст 11 читается на фонах 1, 2 и 3", (mode) => {
    for (const start of STARTS) {
      for (const scale of ladders(seedAt(start), 7, mode)) {
        for (const background of ["1", "2", "3"] as ScaleKey[]) {
          expect(
            contrastRatio(scale["11"], scale[background]),
            `старт ${start}°, режим ${mode}, фон ${background}`,
          ).toBeGreaterThanOrEqual(AA_TEXT);
        }
      }
    }
  });

  it.each(MODES)("в режиме %s рамка 7 отделяется от фона 2 внутри своей категории", (mode) => {
    for (const scale of ladders("#0f6fde", 7, mode)) {
      expect(deltaEok(scale["7"], scale["2"])).toBeGreaterThanOrEqual(OKLAB_JND);
    }
  });
});
