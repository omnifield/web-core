// Отрицательные случаи проверяются на ИМЕНОВАННЫХ узлах своего уровня, пустой путь несут оба
// случая «верного дерева» дословно — разбор в FAQ.md, «Тесты». Утверждения о типах проверяет
// `pnpm typecheck`, рантайм-тело пустое.

import { describe, expectTypeOf, it } from "vitest";

import type { PassportAssembly, PassportAssemblyNode } from "../src/engine/passport/assembly/index.js";

// Повторяет форму реальной io-схемы компонента, но не импортирует её: тест про машинерию типов,
// не про конкретную схему.
interface Item {
  readonly id: string;
  readonly title: string;
}

interface Section {
  readonly id: string;
  readonly title: string;
  readonly items?: readonly Item[];
}

interface AccordionInput {
  readonly sections: readonly Section[];
}

type Part = "root" | "item" | "itemTrigger" | "itemContent" | "itemIndicator";
type Registry = "button";

describe("PassportAssembly<Part, Registry, Data> — real accordion-shaped tree", () => {
  it("accepts the actual tree: absolute repeat at the root, relative everything below it", () => {
    const valid: PassportAssembly<Part, Registry, AccordionInput> = {
      name: "action-list",
      means: "proof",
      tree: {
        node: "root",
        children: [
          {
            node: "item",
            repeat: { path: "/sections" },
            bind: { value: "id" },
            children: [
              {
                node: "itemTrigger",
                children: [
                  { genus: "text", value: { path: "title" } },
                  { node: "itemIndicator", children: [] },
                ],
              },
              {
                node: "itemContent",
                children: [
                  {
                    node: "button",
                    repeat: { path: "items" },
                    bind: { value: "id", label: "title", payload: "" },
                    on: {
                      click: {
                        event: { name: "triggerClick", context: { payload: { path: "" } } },
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    expectTypeOf(valid).toMatchTypeOf<PassportAssembly<Part, Registry, AccordionInput>>();
  });

  it("rejects a relative repeat path at the untouched root — nothing has narrowed anything yet", () => {
    const wrongFormat: PassportAssemblyNode<Part, Registry, AccordionInput, true> = {
      node: "item",
      // @ts-expect-error — "sections" (no leading "/") is only legal once already inside a repeat.
      repeat: { path: "sections" },
    };
    void wrongFormat;
  });

  it("rejects an absolute path where the tree has already been narrowed by an ancestor repeat", () => {
    const wrongFormat: PassportAssemblyNode<Part, Registry, Section, false> = {
      node: "button",
      // @ts-expect-error — "/items" is absolute; from inside the outer repeat this must be relative ("items").
      repeat: { path: "/items" },
    };
    void wrongFormat;
  });

  it("\"\" (self-reference) is legal in bind and in DispatchAction's context, at any AtRoot", () => {
    const selfRef: PassportAssemblyNode<Part, Registry, Item, false> = {
      node: "button",
      bind: { value: "id", label: "title", payload: "" },
      on: { click: { event: { name: "click", context: { payload: { path: "" } } } } },
    };
    expectTypeOf(selfRef).toMatchTypeOf<PassportAssemblyNode<Part, Registry, Item, false>>();

    const selfRefAtRoot: PassportAssemblyNode<Part, Registry, AccordionInput, true> = {
      node: "root",
      bind: { whole: "" },
    };
    expectTypeOf(selfRefAtRoot).toMatchTypeOf<PassportAssemblyNode<Part, Registry, AccordionInput, true>>();
  });

  it("\"\" does not swallow a real typo next to it", () => {
    const typo: PassportAssemblyNode<Part, Registry, Item, false> = {
      node: "button",
      // @ts-expect-error — "titel" is still a typo even though "payload" (a sibling key) legally holds "".
      bind: { payload: "", label: "titel" },
    };
    void typo;
  });

  it("rejects a typo in bind two levels deep, inside the nested repeat", () => {
    const typo: PassportAssemblyNode<Part, Registry, Item, false> = {
      node: "button",
      // @ts-expect-error — "titel" is a typo; the item's own field is "title".
      bind: { label: "titel" },
    };
    void typo;
  });

  it("the untyped default (no Data argument) stays fully permissive", () => {
    const untyped: PassportAssembly<Part, Registry> = {
      name: "x",
      means: "x",
      tree: {
        node: "item",
        repeat: { path: "whatever-nobody-checks" },
        bind: { x: "literally-anything" },
        children: [{ node: "itemTrigger", bind: { y: "also-anything" } }],
      },
    };
    expectTypeOf(untyped).toMatchTypeOf<PassportAssembly<Part, Registry>>();
  });
});
