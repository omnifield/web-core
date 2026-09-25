import { passportLookup, skinGaps, withPassports } from "@web-core/skin";
import type { PassportEditorInfo } from "@web-core/skin/editor";
import type { Outfit, Palette } from "@web-core/skin/model";
import { describe, expect, it } from "vitest";

import { passport } from "../entity/passport";
import { editorInfo } from "../playground/index";
import { form } from "../playground/recipe";

const lookup = passportLookup([passport]);
const bound = withPassports(lookup);

const palette: Palette = {
  name: "test-palette",
  scales: {
    accent: "#3457d5",
    neutral: "#6b7280",
    danger: "#c2282e",
    success: "#197a3d",
    warning: "#a35a06",
  },
  dimensions: {
    radius: "10px",
    space: { narrow: "0.375rem", wide: "0.5rem", between: ["360px", "1280px"] },
    "font-size": { narrow: "0.9375rem", wide: "1rem", between: ["360px", "1280px"] },
    column: "1rem",
    "control-height": { narrow: "2rem", wide: "2.25rem", between: ["360px", "1280px"] },
    rail: { narrow: "12rem", wide: "14rem", between: ["360px", "1280px"] },
    card: { narrow: "20rem", wide: "24rem", between: ["360px", "1280px"] },
    layout: { narrow: "64rem", wide: "80rem", between: ["360px", "1280px"] },
    "border-width": "1px",
    tracking: "0em",
    density: "1",
  },
  light: {
    "leading-none": "1",
    "leading-tight": "1.2",
    "leading-snug": "1.35",
    "leading-normal": "1.5",
    "leading-relaxed": "1.7",
    "weight-normal": "400",
    "weight-medium": "500",
    "weight-semibold": "600",
    "weight-bold": "700",
    "motion-instant": "75ms",
    "motion-fast": "150ms",
    "motion-normal": "250ms",
    "motion-slow": "400ms",
    "ease-linear": "linear",
    "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
    "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
    "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
    "accent-contrast": "#ffffff",
    "danger-contrast": "#ffffff",
    "success-contrast": "#ffffff",
    "warning-contrast": "#ffffff",
  },
  dark: {
    "accent-contrast": "#ffffff",
    "danger-contrast": "#ffffff",
    "success-contrast": "#ffffff",
    "warning-contrast": "#ffffff",
    "accent-9": "#3457d5",
    "accent-10": "#4062df",
    "danger-9": "#c2282e",
    "danger-10": "#d13237",
    "success-9": "#197a3d",
    "success-10": "#1a8040",
    "warning-9": "#a35a06",
    "warning-10": "#aa5e06",
  },
};

const outfit: Outfit = { name: "markdown-proof", palette: palette.name, forms: [form.name] };
const assembled = bound.assemble(outfit, { palettes: [palette], forms: [form] });
const css = bound.generateSkinCss(assembled.skin);

function ruleFor(needle: string): string | undefined {
  return css.split("}").find((chunk) => chunk.includes(needle));
}

describe("доказательный рецепт markdown — паспорт одевается целиком", () => {
  it("не несёт ни ссылочного, ни структурного изъяна против настоящей палитры", () => {
    expect(bound.checkSkin(assembled.skin)).toEqual([]);
  });

  it("порождает настоящий CSS на все восемь частей, а не пустой набор правил", () => {
    expect(css).toContain('[data-scope="markdown"]');

    for (const part of ["root", "heading", "paragraph", "list", "code", "table", "quote", "link"]) {
      expect(css, `часть «${part}» не одета ни одним правилом`).toContain(`[data-part="${part}"]`);
    }
  });

  it("покрывает каждое состояние, объявленное паспортом, — без молчаливого пробела", () => {
    expect(skinGaps(assembled.skin, [passport], [editorInfo as PassportEditorInfo])).toEqual([]);
  });

  it("размер заголовка едет с меткой уровня, а не с видом документа", () => {
    const rule = ruleFor('data-level="1"');

    expect(rule).toBeDefined();
    expect(rule).toContain("font-size");
    expect(rule).not.toContain("data-variant");
  });

  it("код внутри строки отличается от блока своей меткой", () => {
    const rule = ruleFor("data-inline");

    expect(rule).toBeDefined();
    expect(rule).toContain("display: inline");
  });

  it("нумерованный список отличается от маркированного своей меткой", () => {
    const rule = ruleFor("data-ordered");

    expect(rule).toBeDefined();
    expect(rule).toContain("list-style-type: decimal");
  });
});
