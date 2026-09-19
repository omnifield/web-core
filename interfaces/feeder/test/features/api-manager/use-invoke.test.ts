import { z } from "@web-core/io";
import { createRoot } from "@web-core/solid";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OpenapiEndpoint } from "../../../src/entities/openapi";
import { useInvoke } from "../../../src/features/api-manager";

const endpoint: OpenapiEndpoint = {
  method: "GET",
  url: "https://back/v2/users",
  schema: z.object({}),
};

function stubFetch(handler: () => Promise<Response>) {
  const mock = vi.fn(handler);
  vi.stubGlobal("fetch", mock);
  return mock;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useInvoke", () => {
  it("до первого вызова результата нет и ничего не висит", () => {
    createRoot((dispose) => {
      const invocation = useInvoke(() => endpoint);

      expect(invocation.result()).toBeUndefined();
      expect(invocation.failure()).toBeUndefined();
      expect(invocation.pending()).toBe(false);
      dispose();
    });
  });

  it("на время вызова поднимает «идёт» и опускает после", async () => {
    let release: (() => void) | undefined;
    stubFetch(
      async () =>
        new Promise<Response>((resolve) => {
          release = () => resolve(jsonResponse([{ id: 1 }]));
        }),
    );

    await createRoot(async (dispose) => {
      const invocation = useInvoke(() => endpoint);

      const call = invocation.call({});
      expect(invocation.pending()).toBe(true);

      release?.();
      await call;

      expect(invocation.pending()).toBe(false);
      expect(invocation.result()?.ok).toBe(true);
      dispose();
    });
  });

  it("не-2xx приходит результатом со статусом, а не отказом", async () => {
    stubFetch(async () => jsonResponse({ message: "нет такого" }, { status: 404 }));

    await createRoot(async (dispose) => {
      const invocation = useInvoke(() => endpoint);
      await invocation.call({});

      expect(invocation.result()?.status).toBe(404);
      expect(invocation.failure()).toBeUndefined();
      dispose();
    });
  });

  it("сорванный транспорт — названная причина, а не исключение наружу", async () => {
    stubFetch(async () => {
      throw new Error("сети нет");
    });

    await createRoot(async (dispose) => {
      const invocation = useInvoke(() => endpoint);
      await invocation.call({});

      expect(invocation.failure()).toBe("сети нет");
      expect(invocation.result()).toBeUndefined();
      expect(invocation.pending()).toBe(false);
      dispose();
    });
  });

  it("удачный вызов после сорванного убирает прежнюю причину", async () => {
    let broken = true;
    stubFetch(async () => {
      if (broken) throw new Error("сети нет");
      return jsonResponse([{ id: 1 }]);
    });

    await createRoot(async (dispose) => {
      const invocation = useInvoke(() => endpoint);
      await invocation.call({});
      expect(invocation.failure()).toBe("сети нет");

      broken = false;
      await invocation.call({});

      expect(invocation.failure()).toBeUndefined();
      expect(invocation.result()?.ok).toBe(true);
      dispose();
    });
  });
});
