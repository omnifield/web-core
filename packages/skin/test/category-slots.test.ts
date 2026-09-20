// Живой довод: семь типов данных мастера сведения нужно раскрасить устойчиво, а шкалы для этого
// (`buildCategoryScales`, `@web-core/style`) в CSS не попадали — печать переменных живёт здесь.
// Фикстуры ниже — минимальный размер обоих обещаний: слот адресуется вместе со ступенью, и
// категорийное имя проходит те же проверки, что обычная ступень шкалы, а не проезжает молча.

import { createAnatomy } from "@zag-js/anatomy";
import { CATEGORY_SLOTS, CATEGORY_TELLING, OKLAB_JND, type ScaleValues } from "@web-core/style";
import { describe, expect, it } from "vitest";

import { passportLookup } from "../src/engine/address/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";
import { checkSkin } from "../src/engine/rules/index.js";
import type { Skin, SlotRecipe } from "../src/engine/recipe/index.js";
import { slotClashes } from "../src/engine/seeds/category.js";
import { checkCategorySlots, skinValues } from "../src/engine/seeds/index.js";

const SEED = "#3b82f6";
const STEPS = 13;

function skinOf(category: boolean, recipe?: SlotRecipe): Skin {
  return {
    name: "category-proof",
    variables: { scales: { accent: { seed: SEED, category } } },
    recipes: recipe ? { "swatch-proof": recipe } : {},
  };
}

function lookupOf() {
  const anatomy = createAnatomy("swatch-proof").parts("root");

  return passportLookup([
    definePassport({
      anatomy,
      root: "root",
      parts: [{ name: "root", states: [] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    }),
  ]);
}

describe("печать категорийных слотов", () => {
  it("флаг выключен — ни одной категорийной переменной", () => {
    const names = [...skinValues(skinOf(false), "light").keys()];

    expect(names.filter((name) => name.includes("category"))).toEqual([]);
  });

  it("флаг включён — семь слотов по тринадцать ступеней, имя несёт и слот, и ступень", () => {
    const names = [...skinValues(skinOf(true), "light").keys()];
    const category = names.filter((name) => name.startsWith("accent-category-"));

    expect(category).toHaveLength(CATEGORY_SLOTS * STEPS);
    expect(category).toContain("accent-category-1-9");
    expect(category).toContain("accent-category-7-contrast");
  });

  it("фон бейджа берётся на -4/-5, и это не telling-ступени — печатаются обе группы", () => {
    const names = new Set(skinValues(skinOf(true), "light").keys());

    for (const step of ["4", "5", ...CATEGORY_TELLING]) {
      expect(names.has(`accent-category-3-${step}`)).toBe(true);
    }
  });

  it("половины расходятся значением при одном и том же имени", () => {
    const light = skinValues(skinOf(true), "light");
    const dark = skinValues(skinOf(true), "dark");

    expect(dark.get("accent-category-3-9")?.value).not.toBe(light.get("accent-category-3-9")?.value);
  });

  it("напечатанное имя известно рецепту — ссылка не считается неизвестной", () => {
    const recipe: SlotRecipe = {
      base: { root: { props: { backgroundColor: "var(--accent-category-3-4)" } } },
    };

    const flaws = checkSkin(skinOf(true, recipe), lookupOf());

    expect(flaws.filter((flaw) => flaw.name === "unknown-value")).toEqual([]);
  });

  it("без флага та же ссылка — неизвестное имя", () => {
    const recipe: SlotRecipe = {
      base: { root: { props: { backgroundColor: "var(--accent-category-3-4)" } } },
    };

    const flaws = checkSkin(skinOf(false, recipe), lookupOf());

    expect(flaws.some((flaw) => flaw.name === "unknown-value")).toBe(true);
  });
});

describe("гейт назначения ступени узнаёт категорийное имя", () => {
  it("текст бейджа ступенью заливки — изъян", () => {
    const recipe: SlotRecipe = { base: { root: { props: { color: "var(--accent-category-3-9)" } } } };

    const flaws = checkSkin(skinOf(true, recipe), lookupOf());

    expect(flaws.some((flaw) => flaw.name === "step-purpose-mismatch")).toBe(true);
  });

  it("текст бейджа ступенью краски (-11) — норма", () => {
    const recipe: SlotRecipe = { base: { root: { props: { color: "var(--accent-category-3-11)" } } } };

    const flaws = checkSkin(skinOf(true, recipe), lookupOf());

    expect(flaws.filter((flaw) => flaw.name === "step-purpose-mismatch")).toEqual([]);
  });

  it("рамка бейджа ступенью заливки (-7) — норма", () => {
    const recipe: SlotRecipe = { base: { root: { props: { borderColor: "var(--accent-category-7-7)" } } } };

    const flaws = checkSkin(skinOf(true, recipe), lookupOf());

    expect(flaws.filter((flaw) => flaw.name === "step-purpose-mismatch")).toEqual([]);
  });
});

describe("расхождение слотов считается, а не обещается", () => {
  it("шкала без флага не проверяется вовсе", () => {
    expect(checkCategorySlots({ scales: { accent: { seed: SEED } } })).toEqual([]);
  });

  it("непарсящееся семя не проверяется — о нём говорит отказ семени, не эта проверка", () => {
    expect(checkCategorySlots({ scales: { accent: { seed: "не цвет", category: true } } })).toEqual([]);
  });

  it("живые семена расходятся на telling-ступенях в обеих половинах", () => {
    for (const seed of [SEED, "#000000", "#ffffff", "#808080", "oklch(0.02 0.01 20)"]) {
      expect(checkCategorySlots({ scales: { accent: { seed, category: true } } })).toEqual([]);
    }
  });

  it("сошедшиеся слоты называются поимённо, с измеренным расхождением", () => {
    const near = (hue: number): ScaleValues =>
      Object.fromEntries(
        [...CATEGORY_TELLING].map((step) => [step, `oklch(0.5 0.15 ${hue})`]),
      ) as unknown as ScaleValues;

    const clashes = slotClashes("accent", "light", [near(20), near(20.4), near(200)]);

    expect(clashes).toHaveLength(CATEGORY_TELLING.length);
    expect(clashes[0]!.slots).toEqual([1, 2]);
    expect(clashes[0]!.distance).toBeLessThan(OKLAB_JND);
    expect(clashes[0]!.means).toContain("не различит");
  });
});
