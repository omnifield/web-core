import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { apiCatalogOf, endpointBy, endpointKey } from "../../../src/entities/openapi";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(
  join(fixtureDir, "fixtures/petstore.yaml"),
  "utf-8",
);

describe("apiCatalogOf", () => {
  it("распознаёт схему и складывает ручки в стор своего API", async () => {
    const store = apiCatalogOf("load-ok");
    await store.actions.loadSchema(petstore);

    expect(store.get().status).toBe("ready");
    expect(store.get().endpoints.length).toBeGreaterThan(0);
    expect(store.get().endpoints.map(endpointKey)).toContain(
      "GET https://petstore.swagger.io/v2/pet/findByStatus",
    );
  });

  it("нераспознанный документ — статус failed и пустой состав, а не исключение наружу", async () => {
    const store = apiCatalogOf("load-fail");
    await store.actions.loadSchema("это не сваггер");

    expect(store.get().status).toBe("failed");
    expect(store.get().endpoints).toEqual([]);
    expect(store.get().error).toBeTypeOf("string");
  });

  it("ручка, заведённая руками, ложится рядом с распознанными и находится по айди", async () => {
    const store = apiCatalogOf("manual");
    await store.actions.loadSchema(petstore);

    store.actions.addEndpoint({
      method: "GET",
      url: "https://my.back/users",
      params: [{ name: "limit", type: "number", required: false }],
    });

    const id = "GET https://my.back/users";
    expect(endpointBy(store.get(), id)?.url).toBe("https://my.back/users");

    store.actions.removeEndpoint(id);
    expect(endpointBy(store.get(), id)).toBeUndefined();
    expect(store.get().endpoints.length).toBeGreaterThan(0);
  });

  it("повторный ввод той же ручки заменяет её, а не двоит: айди — метод+url", () => {
    const store = apiCatalogOf("same-key");
    store.actions.addEndpoint({ method: "GET", url: "/users", params: [] });
    store.actions.addEndpoint({
      method: "GET",
      url: "/users",
      params: [{ name: "limit", type: "number", required: false }],
    });

    expect(store.get().endpoints).toHaveLength(1);
  });

  it("два API не видят ручки друг друга", () => {
    const first = apiCatalogOf("first");
    const second = apiCatalogOf("second");

    first.actions.addEndpoint({ method: "GET", url: "/a", params: [] });

    expect(first.get().endpoints).toHaveLength(1);
    expect(second.get().endpoints).toHaveLength(0);
  });
});
