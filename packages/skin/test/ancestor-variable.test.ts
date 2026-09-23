// Переменная предка, прочитанная через блок `ancestors`, законна — разбор в FAQ.md, «Переменные
// компонента».

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";

import { passportLookup } from "../src/engine/address/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";
import { checkSkin } from "../src/engine/rules/index.js";
import type { Skin, SlotRecipe } from "../src/engine/recipe/index.js";

const anatomy = createAnatomy("branch-proof").parts("branch", "branchControl");

const passport = definePassport({
  anatomy,
  root: "branch",
  parts: [
    { name: "branch", states: [], variables: [{ name: "--depth", setBy: "consumer" }] },
    { name: "branchControl", states: [] },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

const lookup = passportLookup([passport]);

function skinOf(recipe: SlotRecipe): Skin {
  return { name: "proof", variables: {}, recipes: { "branch-proof": recipe } };
}

describe("growAncestor reads the ancestor's OWN variables, not only the growing part's", () => {
  it("a rule addressed through an ancestor may use a variable declared ON that ancestor", () => {
    const recipe: SlotRecipe = {
      base: {
        branchControl: {
          props: { display: "flex" },
          ancestors: [{ component: "branch-proof", part: "branch", style: { props: { color: "var(--depth)" } } }],
        },
      },
    };

    const flaws = checkSkin(skinOf(recipe), lookup);
    expect(flaws.filter((flaw) => flaw.name === "variable-elsewhere")).toEqual([]);
  });

  it("the SAME variable, referenced directly on the child's own props (not through ancestors), still reads as elsewhere", () => {
    // Control: proves the fix is scoped to the ancestor's own style block, not a blanket widening
    // of what the child part is allowed to reference.
    const recipe: SlotRecipe = {
      base: {
        branchControl: { props: { color: "var(--depth)" } },
      },
    };

    const flaws = checkSkin(skinOf(recipe), lookup);
    expect(flaws.some((flaw) => flaw.name === "variable-elsewhere")).toBe(true);
  });

  it("a variable belonging to neither the growing part nor the named ancestor still reads as elsewhere", () => {
    // Control: proves the fix adds exactly the ancestor's variables, not every variable anywhere.
    const recipe: SlotRecipe = {
      base: {
        branch: { props: {} },
        branchControl: {
          ancestors: [{ component: "branch-proof", part: "branch", style: { props: { color: "var(--nowhere)" } } }],
        },
      },
    };

    const flaws = checkSkin(skinOf(recipe), lookup);
    expect(flaws.some((flaw) => flaw.name === "unknown-value")).toBe(true);
  });
});
