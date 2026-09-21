import { describe, expect, it } from "vitest";

import { endpointLabel, parseSchema, type EndpointDescriptor } from "../../../src/entities/openapi";

const bare: EndpointDescriptor = {
  id: "e1",
  method: "GET",
  url: "https://back/users",
  groupId: "g-users",
  params: [],
};

const SWAGGER = `
swagger: "2.0"
host: back
basePath: /
paths:
  /pets/findByStatus:
    get:
      summary: Найти питомцев по статусу
      operationId: findPetsByStatus
      tags: [pet]
  /pets/{id}:
    get:
      operationId: getPetById
      tags: [pet]
  /store/inventory:
    get:
      tags: [store]
`;

describe("endpointLabel", () => {
  it("имя ручки — подпись узла", () => {
    expect(endpointLabel({ ...bare, name: "Список людей" })).toBe("Список людей");
  });

  it("имени нет — подписываемся методом и урлом, как раньше", () => {
    expect(endpointLabel(bare)).toBe("GET https://back/users");
    expect(endpointLabel({ ...bare, name: "   " })).toBe("GET https://back/users");
  });
});

describe("имя при разборе документа", () => {
  it("берётся человеческое, а машинное — только если человеческого нет", async () => {
    const document = await parseSchema(SWAGGER);

    expect(document.endpoints.map((one) => one.name)).toEqual([
      "Найти питомцев по статусу",
      "getPetById",
      undefined,
    ]);
  });
});
