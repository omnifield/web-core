import { mutate } from "@web-core/store/mutate";
import { describe, expect, it } from "vitest";

import {
  addEndpoint,
  newTag,
  NO_TAG,
  removeEndpoint,
  removeTag,
  type EndpointDescriptor,
  type SchemaDocument,
} from "../../../src/entities/openapi";

function document(): SchemaDocument {
  return {
    endpoints: [
      { id: "get-pet", method: "GET", url: "/pet", tag: "pet", params: [] },
      { id: "add-pet", method: "POST", url: "/pet", tag: "pet", params: [] },
      { id: "get-order", method: "GET", url: "/store/order", tag: "store", params: [] },
      { id: "loose", method: "GET", url: "/loose", params: [] },
    ],
    defs: { Pet: { type: "object" } },
  };
}

function ids(endpoints: readonly EndpointDescriptor[]): string[] {
  return endpoints.map((endpoint) => endpoint.id);
}

describe("addEndpoint", () => {
  it("заводит пустую ручку в названном теге — заполнять её человеку", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "store");
    })(document());

    const added = next.endpoints.find((endpoint) => endpoint.url === "");
    expect(added).toMatchObject({ method: "GET", url: "", tag: "store", params: [] });
    expect(added?.id).toBeTypeOf("string");
  });

  it("новая ручка встаёт первой в своём теге, а тег остаётся на месте", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "store");
    })(document());

    const at = next.endpoints.findIndex((endpoint) => endpoint.url === "");
    expect(at).toBe(2);
    expect(next.endpoints[at]?.tag).toBe("store");
    expect(ids(next.endpoints.toSpliced(at, 1))).toEqual([
      "get-pet",
      "add-pet",
      "get-order",
      "loose",
    ]);
  });

  it("тег, которого ещё нет, заводится первым в документе", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "свежий");
    })(document());

    expect(next.endpoints[0]).toMatchObject({ tag: "свежий", url: "" });
  });

  it("айди новой ручки выдан и не повторяется", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "раз");
      addEndpoint(draft, "два");
    })(document());

    const added = next.endpoints.filter((endpoint) => endpoint.url === "");
    expect(new Set(ids(added)).size).toBe(2);
    expect(ids(document().endpoints)).not.toContain(added[0]?.id);
  });

  it("в группе «без тега» ручка заводится без тега, а не с тегом «unknown»", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, NO_TAG);
    })(document());

    const at = next.endpoints.findIndex((endpoint) => endpoint.url === "");
    expect(next.endpoints[at]?.tag).toBeUndefined();
    expect(at).toBe(3);
  });

  it("соседи и общие типы не задеты", () => {
    const before = document();
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "pet");
    })(before);

    expect(next.endpoints.at(-1)).toBe(before.endpoints.at(-1));
    expect(next.defs).toBe(before.defs);
  });
});

describe("newTag", () => {
  it("каждый вызов даёт своё имя — повторный «+» не копит ручки в один тег", () => {
    const names = new Set([newTag(), newTag(), newTag()]);

    expect(names.size).toBe(3);
  });
});

describe("removeEndpoint", () => {
  it("убирает ручку по айди, соседей не трогает", () => {
    const next = mutate<SchemaDocument>((draft) => removeEndpoint(draft, "get-pet"))(document());

    expect(ids(next.endpoints)).toEqual(["add-pet", "get-order", "loose"]);
  });

  it("ручку с тем же методом и урлом не задевает — айди разные", () => {
    const before = document();
    const next = mutate<SchemaDocument>((draft) => removeEndpoint(draft, "get-pet"))(before);

    expect(next.endpoints.filter((endpoint) => endpoint.url === "/pet")).toHaveLength(1);
  });

  it("нетронутые ручки сохраняют ссылку", () => {
    const before = document();
    const next = mutate<SchemaDocument>((draft) => removeEndpoint(draft, "get-pet"))(before);

    expect(next.endpoints[0]).toBe(before.endpoints[1]);
    expect(next.defs).toBe(before.defs);
  });

  it("айди, которого нет, ничего не меняет", () => {
    const before = document();
    const next = mutate<SchemaDocument>((draft) => removeEndpoint(draft, "нет-такой"))(before);

    expect(next).toBe(before);
  });
});

describe("removeTag", () => {
  it("уносит все ручки тега разом", () => {
    const next = mutate<SchemaDocument>((draft) => removeTag(draft, "pet"))(document());

    expect(ids(next.endpoints)).toEqual(["get-order", "loose"]);
  });

  it("группа «без тега» убирается так же, как именованная", () => {
    const next = mutate<SchemaDocument>((draft) => removeTag(draft, NO_TAG))(document());

    expect(ids(next.endpoints)).not.toContain("loose");
    expect(next.endpoints).toHaveLength(3);
  });

  it("тега, которого нет, ничего не меняет", () => {
    const before = document();

    expect(mutate<SchemaDocument>((draft) => removeTag(draft, "нет"))(before)).toBe(before);
  });
});
