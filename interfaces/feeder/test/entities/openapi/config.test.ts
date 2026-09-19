import { mutate } from "@web-core/store/mutate";
import { describe, expect, it } from "vitest";

import type { Draft } from "@web-core/store/mutate";

import {
  applyEndpointConfig,
  applyGroupConfig,
  endpointConfigOf,
  groupConfigOf,
  NO_GROUP,
  paramTypeOf,
  type SchemaDocument,
} from "../../../src/entities/openapi";

const document: SchemaDocument = {
  endpoints: [
    {
      id: "users",
      method: "GET",
      url: "https://back/users",
      groupId: "g-все",
      params: [
        { name: "id", in: "path", required: true, schema: { type: "integer" } },
        { name: "body", in: "body", required: false, schema: { $ref: "#/definitions/User" } },
      ],
    },
  ],
  groups: [{ id: "g-все", name: "все" }],
  defs: { User: { type: "object", properties: { name: { type: "string" } } } },
};

function edited(recipe: (draft: Draft<SchemaDocument>) => void): SchemaDocument {
  return mutate<SchemaDocument>(recipe)(document);
}

describe("конфиг узла", () => {
  it("значение формы ручки снимается с дескриптора, тип параметра — с его схемы", () => {
    expect(endpointConfigOf(document.endpoints[0]!)).toEqual({
      method: "GET",
      url: "https://back/users",
      params: [
        { name: "id", in: "path", required: true, type: "integer" },
        { name: "body", in: "body", required: false, type: "object" },
      ],
    });
  });

  it("параметр без своего типа читается строкой, ссылка — объектом", () => {
    expect(paramTypeOf({})).toBe("string");
    expect(paramTypeOf({ $ref: "#/definitions/User" })).toBe("object");
  });

  it("правка ручки кладёт метод, урл и состав параметров", () => {
    const next = edited((draft) =>
      applyEndpointConfig(draft, "users", {
        method: "POST",
        url: "https://back/people",
        params: [{ name: "limit", in: "query", required: false, type: "number" }],
      }),
    );

    expect(next.endpoints[0]).toMatchObject({
      method: "POST",
      url: "https://back/people",
      params: [
        { name: "limit", in: "query", required: false, schema: { type: "number" } },
      ],
    });
  });

  it("описание параметра переживает правку, пока тип тот же", () => {
    const next = edited((draft) =>
      applyEndpointConfig(draft, "users", {
        method: "GET",
        url: "https://back/users",
        params: [
          { name: "body", in: "query", required: true, type: "object" },
          { name: "id", in: "path", required: true, type: "string" },
        ],
      }),
    );

    const [body, id] = next.endpoints[0]!.params;

    expect(body).toMatchObject({ in: "query", schema: { $ref: "#/definitions/User" } });
    expect(id).toMatchObject({ schema: { type: "string" } });
  });

  it("имя группы правится, псевдогруппа не трогается вовсе", () => {
    expect(groupConfigOf({ id: "g-все", name: "все", endpoints: [] })).toEqual({
      name: "все",
    });

    expect(edited((draft) => applyGroupConfig(draft, "g-все", { name: "питомцы" })).groups)
      .toEqual([{ id: "g-все", name: "питомцы" }]);

    expect(edited((draft) => applyGroupConfig(draft, NO_GROUP, { name: "нет" })).groups)
      .toEqual(document.groups);
  });
});
