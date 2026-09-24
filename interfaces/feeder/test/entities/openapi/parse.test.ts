import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { endpointOf, parseSchema, UNKNOWN_GROUP } from "../../../src/entities/openapi";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(join(fixtureDir, "fixtures/petstore.yaml"), "utf-8");

describe("parseSchema", () => {
  it("чужой документ становится нашим — ручки описаны данными, без зода", async () => {
    const document = await parseSchema(petstore);

    const found = document.endpoints.find(
      (endpoint) => endpoint.url === "https://petstore.swagger.io/v2/pet/findByStatus",
    );

    expect(found?.method).toBe("GET");
    expect(document.groups.find((group) => group.id === found?.groupId)?.name).toBe("pet");
    expect(found?.params[0]?.name).toBe("status");
    expect(found?.params[0]?.in).toBe("query");
  });

  it("ручки, которым схема не назвала группу, уходят в обычную группу «unknown»", async () => {
    const document = await parseSchema(
      JSON.stringify({
        swagger: "2.0",
        host: "back",
        basePath: "/v2",
        paths: {
          "/users": { get: { parameters: [] } },
          "/pets": { get: { tags: ["pet"], parameters: [] } },
          "/orders": { get: { parameters: [] } },
        },
      }),
    );

    const unknown = document.groups.find((group) => group.name === UNKNOWN_GROUP);

    expect(unknown?.id).toEqual(expect.any(String));
    expect(document.endpoints.every((endpoint) => endpoint.groupId !== undefined)).toBe(true);
    expect(
      document.endpoints
        .filter((endpoint) => endpoint.groupId === unknown?.id)
        .map((endpoint) => endpoint.url),
    ).toEqual(["https://back/v2/users", "https://back/v2/orders"]);
  });

  it("результат сериализуется — именно он поедет на бэк", async () => {
    const document = await parseSchema(petstore);

    expect(() => JSON.stringify(document)).not.toThrow();
    expect(JSON.parse(JSON.stringify(document))).toEqual(document);
  });

  it("общие типы документа переезжают в `defs`, ссылки на них сохраняются", async () => {
    const document = await parseSchema(petstore);

    expect(Object.keys(document.defs).length).toBeGreaterThan(0);

    const body = document.endpoints
      .flatMap((endpoint) => endpoint.params)
      .find((param) => param.in === "body");

    expect(body?.schema).toHaveProperty("$ref");
  });

  it("из нашего документа собирается форма ручки", async () => {
    const document = await parseSchema(petstore);
    const endpoints = document.endpoints.map((descriptor) => endpointOf(descriptor, document.defs));

    expect(endpoints.map((endpoint) => `${endpoint.method} ${endpoint.url}`)).toContain(
      "GET https://petstore.swagger.io/v2/pet/findByStatus",
    );
    expect(endpoints[0]?.schema.safeParse({}).success).toBeTypeOf("boolean");
  });

  it("нераспознанный документ — исключение с текстом, а не пустой состав", async () => {
    await expect(parseSchema("это не сваггер")).rejects.toThrow();
  });

  it("каждая ручка получает свой айди, и он не производен от содержимого", async () => {
    const document = await parseSchema(petstore);
    const ids = document.endpoints.map((endpoint) => endpoint.id);

    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("два разбора одного документа дают разные айди — айди у записи, а не у текста", async () => {
    const first = await parseSchema(petstore);
    const second = await parseSchema(petstore);

    expect(second.endpoints.map((endpoint) => endpoint.id)).not.toEqual(
      first.endpoints.map((endpoint) => endpoint.id),
    );
  });
});
