// Живой довод: палитра — это список категорий цвета, у каждой имя, семя и своя лесенка, и модель
// одна на все случаи. Раньше рядом жил обход — флаг у шкалы, досчитывавший ЧУЖИЕ цвета и печатавший
// их под чужим именем (`--accent-chart-2`, `--accent-category-3-7`). Потребителю, которому нужно
// семь цветов, теперь не нужен ни флаг, ни особая механика: он объявляет семь категорий.

import { createAnatomy } from "@zag-js/anatomy";
import { buildCategorySeeds } from "@web-core/style";
import { describe, expect, it } from "vitest";

import { passportLookup } from "../src/engine/address/index.js";
import { checkOutfit } from "../src/engine/look/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";
import { checkSkin } from "../src/engine/rules/index.js";
import type { Skin, SlotRecipe } from "../src/engine/recipe/index.js";
import type { Palette } from "../src/engine/look/index.js";
import { checkCategories, skinValues } from "../src/engine/seeds/index.js";

const FIVE = {
  accent: "#3b82f6",
  neutral: "#71717a",
  danger: "#e11d48",
  success: "#16a34a",
  warning: "#f59e0b",
};

function skinOf(scales: Record<string, string>, recipe?: SlotRecipe): Skin {
  return {
    name: "categories-proof",
    variables: { scales },
    recipes: recipe ? { "swatch-proof": recipe } : {},
  };
}

function lookupOf() {
  return passportLookup([
    definePassport({
      anatomy: createAnatomy("swatch-proof").parts("root"),
      root: "root",
      parts: [{ name: "root", states: [] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    }),
  ]);
}

describe("категория сверх пятёрки — обычная категория, без особой механики", () => {
  it("объявленная своя категория печатается той же лесенкой", () => {
    const names = [...skinValues(skinOf({ ...FIVE, purple: "#8b5cf6" }), "light").keys()];

    expect(names).toContain("purple-1");
    expect(names).toContain("purple-9");
    expect(names).toContain("purple-contrast");
    expect(names.filter((name) => name.startsWith("purple-"))).toHaveLength(13);
  });

  it("палитра со своими категориями законна — имя сверх пятёрки больше не изъян", () => {
    const palette: Palette = { name: "brand", scales: { ...FIVE, purple: "#8b5cf6", pink: "#ec4899" } };
    const outfit = { name: "wear", palette: "brand", forms: [] };

    const flaws = checkOutfit(outfit, { palettes: [palette], forms: [] }, lookupOf());

    expect(flaws.filter((flaw) => flaw.name === "outside-vocabulary")).toEqual([]);
  });

  it("но пятёрка остаётся обязательным минимумом", () => {
    const palette: Palette = { name: "brand", scales: { accent: "#3b82f6", purple: "#8b5cf6" } };
    const outfit = { name: "wear", palette: "brand", forms: [] };

    const flaws = checkOutfit(outfit, { palettes: [palette], forms: [] }, lookupOf());

    expect(flaws.map((flaw) => flaw.name)).toContain("palette-incomplete");
  });

  it("ссылка на свою категорию известна рецепту", () => {
    const recipe: SlotRecipe = { base: { root: { props: { backgroundColor: "var(--purple-4)" } } } };

    const flaws = checkSkin(skinOf({ ...FIVE, purple: "#8b5cf6" }, recipe), lookupOf());

    expect(flaws.filter((flaw) => flaw.name === "unknown-value")).toEqual([]);
  });

  it("ссылка на необъявленную категорию — неизвестное имя", () => {
    const recipe: SlotRecipe = { base: { root: { props: { backgroundColor: "var(--purple-4)" } } } };

    const flaws = checkSkin(skinOf(FIVE, recipe), lookupOf());

    expect(flaws.some((flaw) => flaw.name === "unknown-value")).toBe(true);
  });
});

describe("гейт назначения ступени работает на любой категории, не только на пятёрке", () => {
  it("текст своей категорией ступени заливки — изъян", () => {
    const recipe: SlotRecipe = { base: { root: { props: { color: "var(--purple-9)" } } } };

    const flaws = checkSkin(skinOf({ ...FIVE, purple: "#8b5cf6" }, recipe), lookupOf());

    expect(flaws.some((flaw) => flaw.name === "step-purpose-mismatch")).toBe(true);
  });

  it("текст -11, рамка -7 — норма", () => {
    const recipe: SlotRecipe = {
      base: { root: { props: { color: "var(--purple-11)", borderColor: "var(--purple-7)" } } },
    };

    const flaws = checkSkin(skinOf({ ...FIVE, purple: "#8b5cf6" }, recipe), lookupOf());

    expect(flaws.filter((flaw) => flaw.name === "step-purpose-mismatch")).toEqual([]);
  });
});

describe("различимость категорий считается, а не обещается", () => {
  it("живая пятёрка чиста", () => {
    expect(checkCategories({ scales: FIVE })).toEqual([]);
  });

  it("семь категорий, разложенных генератором семян, чисты", () => {
    const seeds = buildCategorySeeds("#3b82f6", 7);
    const scales = Object.fromEntries(seeds.map((seed, index) => [`type-${index + 1}`, seed]));

    expect(checkCategories({ scales })).toEqual([]);
  });

  it("две похожие категории, объявленные руками, названы поимённо", () => {
    const clashes = checkCategories({
      scales: { ...FIVE, "type-a": "oklch(0.74 0.12 300)", "type-b": "oklch(0.74 0.12 301)" },
    });
    const pair = clashes.find(
      (clash) => clash.categories[0] === "type-a" && clash.categories[1] === "type-b",
    );

    expect(pair).toBeDefined();
    expect(pair!.distance).toBeLessThan(0.02);
    expect(pair!.means).toContain("не различит");
  });

  it("непарсящееся семя не проверяется — о нём говорит отказ семени", () => {
    expect(checkCategories({ scales: { accent: "не цвет" } })).toEqual([]);
  });
});
