import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { endpointKey, endpointOf, parseSchema } from "../../../src/entities/openapi";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(join(fixtureDir, "fixtures/petstore.yaml"), "utf-8");

describe("parseSchema", () => {
  it("чужой документ становится нашим — ручки описаны данными, без зода", async () => {
    const document = await parseSchema(petstore);

    const found = document.endpoints.find(
      (endpoint) => endpoint.url === "https://petstore.swagger.io/v2/pet/findByStatus",
    );

    expect(found?.method).toBe("GET");
    expect(found?.tag).toBe("pet");
    expect(found?.params[0]?.name).toBe("status");
    expect(found?.params[0]?.in).toBe("query");
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

    expect(endpoints.map(endpointKey)).toContain(
      "GET https://petstore.swagger.io/v2/pet/findByStatus",
    );
    expect(endpoints[0]?.schema.safeParse({}).success).toBeTypeOf("boolean");
  });

  it("нераспознанный документ — исключение с текстом, а не пустой состав", async () => {
    await expect(parseSchema("это не сваггер")).rejects.toThrow();
  });
});
