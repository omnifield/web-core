import { mutate } from "@web-core/store/mutate";
import { describe, expect, it } from "vitest";

import {
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
