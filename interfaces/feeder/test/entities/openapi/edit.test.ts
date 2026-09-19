import { mutate } from "@web-core/store/mutate";
import { describe, expect, it } from "vitest";

import {
  endpointKey,
  NO_TAG,
  removeEndpoint,
  removeTag,
  type SchemaDocument,
} from "../../../src/entities/openapi";

function document(): SchemaDocument {
  return {
    endpoints: [
      { method: "GET", url: "/pet", tag: "pet", params: [] },
      { method: "POST", url: "/pet", tag: "pet", params: [] },
      { method: "GET", url: "/store/order", tag: "store", params: [] },
      { method: "GET", url: "/loose", params: [] },
    ],
    defs: { Pet: { type: "object" } },
  };
}

describe("removeEndpoint", () => {
  it("убирает ручку по айди, соседей не трогает", () => {
    const next = mutate<SchemaDocument>((draft) => removeEndpoint(draft, "GET /pet"))(document());

    expect(next.endpoints.map(endpointKey)).toEqual([
      "POST /pet",
      "GET /store/order",
      "GET /loose",
    ]);
  });

  it("нетронутые ручки сохраняют ссылку", () => {
    const before = document();
    const next = mutate<SchemaDocument>((draft) => removeEndpoint(draft, "GET /pet"))(before);

    expect(next.endpoints[0]).toBe(before.endpoints[1]);
    expect(next.defs).toBe(before.defs);
  });

  it("айди, которого нет, ничего не меняет", () => {
    const before = document();
    const next = mutate<SchemaDocument>((draft) => removeEndpoint(draft, "GET /нет"))(before);

    expect(next).toBe(before);
  });
});

describe("removeTag", () => {
  it("уносит все ручки тега разом", () => {
    const next = mutate<SchemaDocument>((draft) => removeTag(draft, "pet"))(document());

    expect(next.endpoints.map(endpointKey)).toEqual(["GET /store/order", "GET /loose"]);
  });

  it("группа «без тега» убирается так же, как именованная", () => {
    const next = mutate<SchemaDocument>((draft) => removeTag(draft, NO_TAG))(document());

    expect(next.endpoints.map(endpointKey)).not.toContain("GET /loose");
    expect(next.endpoints).toHaveLength(3);
  });

  it("тега, которого нет, ничего не меняет", () => {
    const before = document();

    expect(mutate<SchemaDocument>((draft) => removeTag(draft, "нет"))(before)).toBe(before);
  });
});
