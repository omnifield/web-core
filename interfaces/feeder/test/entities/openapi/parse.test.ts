import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { endpointKey, parseEndpoints } from "../../../src/entities/openapi";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(join(fixtureDir, "fixtures/petstore.yaml"), "utf-8");

describe("parseEndpoints", () => {
  it("разбирает документ в состав ручек", async () => {
    const endpoints = await parseEndpoints(petstore);

    expect(endpoints.map(endpointKey)).toContain(
      "GET https://petstore.swagger.io/v2/pet/findByStatus",
    );
  });

  it("один и тот же текст всегда даёт один и тот же состав — ручки нигде не копятся", async () => {
    const first = await parseEndpoints(petstore);
    const second = await parseEndpoints(petstore);

    expect(second.map(endpointKey)).toEqual(first.map(endpointKey));
  });

  it("нераспознанный документ — исключение с текстом, а не пустой состав", async () => {
    await expect(parseEndpoints("это не сваггер")).rejects.toThrow();
  });
});
