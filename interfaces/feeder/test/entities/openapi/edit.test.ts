import { mutate } from "@web-core/store/mutate";
import { describe, expect, it } from "vitest";

import {
  addEndpoint,
  addGroup,
  NEW_GROUP,
  NO_GROUP,
  removeEndpoint,
  removeGroup,
  type EndpointDescriptor,
  type SchemaDocument,
} from "../../../src/entities/openapi";

function document(): SchemaDocument {
  return {
    endpoints: [
      { id: "get-pet", method: "GET", url: "/pet", groupId: "g-pet", params: [] },
      { id: "add-pet", method: "POST", url: "/pet", groupId: "g-pet", params: [] },
      { id: "get-order", method: "GET", url: "/store/order", groupId: "g-store", params: [] },
      { id: "loose", method: "GET", url: "/loose", params: [] },
    ],
    groups: [
      { id: "g-pet", name: "pet" },
      { id: "g-store", name: "store" },
    ],
    defs: { Pet: { type: "object" } },
  };
}

function ids(endpoints: readonly EndpointDescriptor[]): string[] {
  return endpoints.map((endpoint) => endpoint.id);
}

describe("addGroup", () => {
  it("заводит группу со своим айди — имя правится, тождество нет", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addGroup(draft);
    })(document());

    expect(next.groups[0]).toMatchObject({ name: NEW_GROUP });
    expect(next.groups[0]?.id).toBeTypeOf("string");
  });

  it("новая группа встаёт первой и приходит пустой — ручку заводят отдельно", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addGroup(draft, "свежая");
    })(document());

    expect(next.groups.map((group) => group.name)).toEqual(["свежая", "pet", "store"]);
    expect(next.endpoints).toEqual(document().endpoints);
  });

  it("две группы с одним именем — разные записи, а не одна", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addGroup(draft, "одно имя");
      addGroup(draft, "одно имя");
    })(document());

    expect(next.groups[0]?.id).not.toBe(next.groups[1]?.id);
  });
});

describe("addEndpoint", () => {
  it("заводит пустую ручку в названной группе — заполнять её человеку", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "g-store");
    })(document());

    const added = next.endpoints.find((endpoint) => endpoint.url === "");
    expect(added).toMatchObject({ method: "GET", url: "", groupId: "g-store", params: [] });
    expect(added?.id).toBeTypeOf("string");
  });

  it("новая ручка встаёт первой в своей группе, соседние группы на месте", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "g-store");
    })(document());

    const at = next.endpoints.findIndex((endpoint) => endpoint.url === "");
    expect(at).toBe(2);
    expect(ids(next.endpoints.toSpliced(at, 1))).toEqual([
      "get-pet",
      "add-pet",
      "get-order",
      "loose",
    ]);
  });

  it("группа пока пустая — ручка встаёт первой в документе", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "g-свежая");
    })(document());

    expect(next.endpoints[0]).toMatchObject({ groupId: "g-свежая", url: "" });
  });

  it("айди новой ручки выдан и не повторяется", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "g-pet");
      addEndpoint(draft, "g-store");
    })(document());

    const added = next.endpoints.filter((endpoint) => endpoint.url === "");
    expect(new Set(ids(added)).size).toBe(2);
    expect(ids(document().endpoints)).not.toContain(added[0]?.id);
  });

  it("в псевдогруппе безгрупповых ручка заводится без группы", () => {
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, NO_GROUP);
    })(document());

    const at = next.endpoints.findIndex((endpoint) => endpoint.url === "");
    expect(next.endpoints[at]?.groupId).toBeUndefined();
    expect(at).toBe(3);
  });

  it("соседи, реестр групп и общие типы не задеты", () => {
    const before = document();
    const next = mutate<SchemaDocument>((draft) => {
      addEndpoint(draft, "g-pet");
    })(before);

    expect(next.endpoints.at(-1)).toBe(before.endpoints.at(-1));
    expect(next.groups).toBe(before.groups);
    expect(next.defs).toBe(before.defs);
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

describe("removeGroup", () => {
  it("уносит запись группы и все ручки под ней разом", () => {
    const next = mutate<SchemaDocument>((draft) => removeGroup(draft, "g-pet"))(document());

    expect(ids(next.endpoints)).toEqual(["get-order", "loose"]);
    expect(next.groups.map((group) => group.id)).toEqual(["g-store"]);
  });

  it("пустая группа уходит без остатка", () => {
    const before = mutate<SchemaDocument>((draft) => {
      addGroup(draft, "пустая");
    })(document());
    const id = before.groups[0]?.id ?? "";

    const next = mutate<SchemaDocument>((draft) => removeGroup(draft, id))(before);

    expect(next.groups.map((group) => group.name)).toEqual(["pet", "store"]);
    expect(next.endpoints).toEqual(before.endpoints);
  });

  it("псевдогруппа безгрупповых убирается так же, как названная", () => {
    const next = mutate<SchemaDocument>((draft) => removeGroup(draft, NO_GROUP))(document());

    expect(ids(next.endpoints)).not.toContain("loose");
    expect(next.endpoints).toHaveLength(3);
    expect(next.groups).toHaveLength(2);
  });

  it("группы, которой нет, ничего не меняет", () => {
    const before = document();

    expect(mutate<SchemaDocument>((draft) => removeGroup(draft, "нет"))(before)).toBe(before);
  });
});
