// Состояния выводятся по ЧАСТИ, а не по паспорту целиком; тело теста реально зовёт объявление
// среза — разбор в FAQ.md, «Тесты».

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, expectTypeOf, it } from "vitest";

import { defineEditorInfo } from "../src/editor/index.js";
import { definePassport, defineSettings } from "../src/engine/passport/form/index.js";

const anatomy = createAnatomy("accordion").parts("root", "item", "itemTrigger", "itemContent");

const open = { name: "open" as const, mark: { kind: "pseudo" as const, name: ":open" } };
const disabled = { name: "disabled" as const, mark: { kind: "attribute" as const, name: "data-disabled" } };
const focus = { name: "focus" as const, mark: { kind: "pseudo" as const, name: ":focus" } };

const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "item", states: [open, disabled] },
    {
      name: "itemTrigger",
      states: [
        open,
        disabled,
        focus,
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
        { name: "active", mark: { kind: "pseudo", name: ":active" } },
      ],
    },
    {
      name: "itemContent",
      states: [{ name: "open-content", mark: { kind: "attribute", name: "data-state", value: "open" } }, { name: "closed", mark: { kind: "attribute", name: "data-state", value: "closed" } }, disabled, focus],
    },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: defineSettings<{ orientation: string; multiple: boolean }>()({
    orientation: {
      values: { kind: "choice", options: [{ value: "vertical" }, { value: "horizontal" }] },
      byDefault: "vertical",
      mark: { kind: "attribute", name: "data-orientation" },
    },
    multiple: { values: { kind: "flag" }, byDefault: false },
  }),
});

describe("StatesOf/ValuesOf подключены к срезу редактора, на реальном стресс-случае accordion", () => {
  it("defineEditorInfo accepts different states per part with zero explicit type arguments", () => {
    const editorInfo = defineEditorInfo(passport, {
      package: "@web-core/ui",
      genus: "component",
      variantAxis: { means: "proof" },
      parts: {
        root: { means: "proof" },
        item: { means: "proof", states: { open: { means: "a" }, disabled: { means: "b" } } },
        itemTrigger: {
          means: "proof",
          states: {
            open: { means: "a" },
            disabled: { means: "b" },
            focus: { means: "c" },
            hover: { means: "d" },
            "focus-visible": { means: "e" },
            active: { means: "f" },
          },
        },
        itemContent: {
          means: "proof",
          states: { "open-content": { means: "a" }, closed: { means: "b" }, disabled: { means: "c" }, focus: { means: "d" } },
        },
      },
      settings: {
        orientation: { means: "o", options: { vertical: { means: "v" }, horizontal: { means: "h" } } },
        multiple: { means: "m" },
      },
      assemblies: [],
      dataPresets: [],
    });

    expect(editorInfo.parts.itemTrigger.states).toHaveProperty("hover");
    expect(editorInfo.settings?.orientation.options).toHaveProperty("vertical");
  });

  it("rejects a typo in itemTrigger's OWN states — six real states, one misspelled", () => {
    // Caught TWICE, defense in depth: `tsc` via the `@ts-expect-error` below, and — belt and
    // braces, in case someone bypasses TypeScript — `defineEditorInfo`'s own runtime check
    // (`define.ts`'s state-name matching), which still runs regardless of the type error.
    expect(() =>
      defineEditorInfo(passport, {
        package: "x",
        genus: "component",
        variantAxis: { means: "x" },
        parts: {
          root: { means: "x" },
          item: { means: "x", states: { open: { means: "a" }, disabled: { means: "b" } } },
          itemTrigger: {
            means: "x",
            states: {
              open: { means: "a" },
              disabled: { means: "b" },
              focus: { means: "c" },
              // @ts-expect-error — "hoover" is a typo; the real state is "hover".
              hoover: { means: "d" },
              "focus-visible": { means: "e" },
              active: { means: "f" },
            },
          },
          itemContent: {
            means: "x",
            states: { "open-content": { means: "a" }, closed: { means: "b" }, disabled: { means: "c" }, focus: { means: "d" } },
          },
        },
        assemblies: [],
        dataPresets: [],
      }),
    ).toThrow();
  });

  it("itemContent does NOT see itemTrigger's states, or vice versa — scoped per part", () => {
    expect(() =>
      defineEditorInfo(passport, {
        package: "x",
        genus: "component",
        variantAxis: { means: "x" },
        parts: {
          root: { means: "x" },
          item: { means: "x", states: { open: { means: "a" }, disabled: { means: "b" } } },
          itemTrigger: {
            means: "x",
            states: {
              open: { means: "a" },
              disabled: { means: "b" },
              focus: { means: "c" },
              hover: { means: "d" },
              "focus-visible": { means: "e" },
              active: { means: "f" },
            },
          },
          itemContent: {
            means: "x",
            states: {
              "open-content": { means: "a" },
              closed: { means: "b" },
              disabled: { means: "c" },
              // @ts-expect-error — "hover" belongs to itemTrigger, not itemContent.
              hover: { means: "d" },
            },
          },
        },
        assemblies: [],
        dataPresets: [],
      }),
    ).toThrow();
  });

  it("rejects a typo in a setting's option value", () => {
    expect(() =>
      defineEditorInfo(passport, {
        package: "x",
        genus: "component",
        variantAxis: { means: "x" },
        parts: {
          root: { means: "x" },
          item: { means: "x", states: { open: { means: "a" }, disabled: { means: "b" } } },
          itemTrigger: {
            means: "x",
            states: { open: { means: "a" }, disabled: { means: "b" }, focus: { means: "c" }, hover: { means: "d" }, "focus-visible": { means: "e" }, active: { means: "f" } },
          },
          itemContent: {
            means: "x",
            states: { "open-content": { means: "a" }, closed: { means: "b" }, disabled: { means: "c" }, focus: { means: "d" } },
          },
        },
        settings: {
          orientation: {
            means: "o",
            // @ts-expect-error — "horizantal" is a typo; the real option is "horizontal".
            options: { vertical: { means: "v" }, horizantal: { means: "h" } },
          },
          multiple: { means: "m" },
        },
        assemblies: [],
        dataPresets: [],
      }),
    ).toThrow();
  });

  it("a real PassportEditorInfo (4 type args) still widens into the bare, all-defaults registry form", () => {
    const editorInfo = defineEditorInfo(passport, {
      package: "x",
      genus: "component",
      variantAxis: { means: "x" },
      parts: {
        root: { means: "x" },
        item: { means: "x", states: { open: { means: "a" }, disabled: { means: "b" } } },
        itemTrigger: {
          means: "x",
          states: { open: { means: "a" }, disabled: { means: "b" }, focus: { means: "c" }, hover: { means: "d" }, "focus-visible": { means: "e" }, active: { means: "f" } },
        },
        itemContent: {
          means: "x",
          states: { "open-content": { means: "a" }, closed: { means: "b" }, disabled: { means: "c" }, focus: { means: "d" } },
        },
      },
      settings: {
        orientation: { means: "o", options: { vertical: { means: "v" }, horizontal: { means: "h" } } },
        multiple: { means: "m" },
      },
      assemblies: [],
      dataPresets: [],
    });

    // Same registry shape `editorInfoOf` uses across the kit (`web-core/ui/src/passport.ts`) and
    // in consuming applications — a real, fully-typed value must fit in it.
    function editorInfoOf(): import("../src/editor/index.js").PassportEditorInfo | undefined {
      return editorInfo;
    }
    expectTypeOf(editorInfoOf()).toEqualTypeOf<import("../src/editor/index.js").PassportEditorInfo | undefined>();
  });
});
