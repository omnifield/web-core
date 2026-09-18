import { z } from "@web-core/io";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OpenapiEndpoint } from "../../../src/entities/openapi";
import { invokeEndpoint } from "../../../src/features/api-manager";

function endpoint(patch: Partial<OpenapiEndpoint> = {}): OpenapiEndpoint {
  return {
    method: "GET",
    url: "https://back/v2/users",
    schema: z.object({}),
    ...patch,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async () => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("invokeEndpoint", () => {
  it("отдаёт статус, заголовки и разобранное тело", async () => {
    stubFetch(jsonResponse([{ id: 1 }]));

    const result = await invokeEndpoint(endpoint(), {});

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.headers["content-type"]).toContain("json");
    expect(result.body).toEqual([{ id: 1 }]);
  });

  it("имя из {плейсхолдера} уходит в путь, остальное — в квери", async () => {
    const fetchMock = stubFetch(jsonResponse({ id: 7 }));

    await invokeEndpoint(endpoint({ url: "https://back/v2/pet/{petId}" }), {
      petId: 7,
      status: "available",
    });

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://back/v2/pet/7?status=available",
    );
  });

  it("body уходит телом запроса и не попадает в квери", async () => {
    const fetchMock = stubFetch(jsonResponse({ ok: true }, { status: 201 }));

    await invokeEndpoint(endpoint({ method: "POST", url: "https://back/v2/pet" }), {
      body: { name: "Барсик" },
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toBe("https://back/v2/pet");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "Барсик" }));
  });

  it("не-2xx — валидный результат со статусом и телом, а не исключение", async () => {
    stubFetch(jsonResponse({ message: "not found" }, { status: 404 }));

    const result = await invokeEndpoint(endpoint(), {});

    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.body).toEqual({ message: "not found" });
  });

  it("сорванный транспорт остаётся исключением — ответа не было вовсе", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );

    await expect(invokeEndpoint(endpoint(), {})).rejects.toThrow(/Failed to fetch/);
  });
});
