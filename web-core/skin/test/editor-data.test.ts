// Реальный `Data`-аргумент на `PassportAssembly` раньше отказывался расширяться в старую
// двухпараметрическую форму `PassportEditorSpec.assemblies`. Дженерик `Data` протянут через
// `PassportEditorSpec`/`PassportEditorInfo`/`defineEditorInfo`/`checkAssembly` — тест проверяет
// всю цепочку целиком, без единого `as`, и рантайм-тело реально зовёт `defineEditorInfo`.

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, expectTypeOf, it } from "vitest";

import { defineEditorInfo, type PassportEditorInfo } from "../src/editor/index.js";
import type { PassportAssembly } from "../src/engine/passport/assembly/index.js";
import { definePassport } from "../src/engine/passport/form/index.js";

// Заглушка вместо `entity/io.ts` компонента — предмет теста типовая машинерия, не схема сама.
interface Item {
  readonly id: string;
  readonly title: string;
}

interface ListInput {
  readonly items: readonly Item[];
}

const anatomy = createAnatomy("list").parts("root", "item");

// Stand-in for `entity/passport.ts`.
const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "item", states: [] },
  ],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  settings: {},
});

// Замена ОДНОЙ объявленной сборки компонента — типизирована реальной схемой, без приведения.
const rows: PassportAssembly<"root" | "item", string, ListInput> = {
  name: "rows",
  means: "proof",
  tree: {
    node: "root",
    children: [{ node: "item", repeat: { path: "/items" }, bind: { value: "id", label: "title" } }],
  },
};

// Замена собранного компонентом списка сборок — без приведения.
const assemblies = [rows];

describe("defineEditorInfo протягивает реальный Data без расширения", () => {
  it("accepts a real-Data PassportAssembly in spec.assemblies with zero explicit type arguments", () => {
    // Вызов той же формы, какой уже пишет каждый компонент кита: ни одного явного параметра типа.
    const editorInfo = defineEditorInfo(passport, {
      package: "@web-core/ui",
      genus: "component",
      variantAxis: { means: "proof" },
      parts: {
        root: { means: "proof" },
        item: { means: "proof" },
      },
      settings: {},
      assemblies,
      dataPresets: [],
    });

    // Срез несёт НАСТОЯЩИЕ данные, не расширенные до `unknown`, и настоящий паспорт четвёртым
    // параметром — отсюда точное сравнение типов, а не совпадение по форме.
    expectTypeOf(editorInfo).toEqualTypeOf<PassportEditorInfo<"root" | "item", string, ListInput, typeof passport>>();
    expect(editorInfo.assemblies).toHaveLength(1);
    expect(editorInfo.assemblies[0]!.tree.node).toBe("root");
  });

  it("a typo introduced at the SOURCE (the assembly itself) is still caught, all the way through", () => {
    const typo: PassportAssembly<"root" | "item", string, ListInput> = {
      name: "rows",
      means: "proof",
      tree: {
        node: "root",
        // @ts-expect-error — "titel" is a typo; Item's own field is "title".
        children: [{ node: "item", repeat: { path: "/items" }, bind: { label: "titel" } }],
      },
    };
    void typo;
  });
});
