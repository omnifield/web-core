import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { z } from "@web-core/io";

import { ADAPTER_KIND } from "../../../src/entities/adapter";
import type { OpenapiEndpoint } from "../../../src/entities/openapi";
import { presetsStore } from "../../../src/entities/preset";
import { serve } from "../../../src/features/api-manager";

const endpoint: OpenapiEndpoint = {
  method: "GET",
  url: "https://back/rates",
  schema: z.object({}),
};

const USERS = {
  provider: ["api", "preset-7", "endpoint-3"],
  consumer: ["component", "user-card"],
};

const body = {
  meta: { title: "Курсы" },
  data: [
    { code: "USD", rate: 1 },
    { code: "EUR", rate: 1.1 },
  ],
};

const sweep = { total: 3, data: [{ id: 1, login: "ada" }, { id: 2, login: "bob" }] };

beforeEach(() => {
  presetsStore.actions.hydrate([]);

  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function saveAdapter(): void {
  presetsStore.actions.add(ADAPTER_KIND, "карточка", {
    root: "/data",
    rules: [
      { id: "r0", target: "/title", from: "/meta/title" },
      { id: "r1", target: "/items/0/label", from: "/code" },
    ],
    providers: { api: { "preset-7": { "endpoint-3": {} } } },
    consumers: { component: { "user-card": {} } },
  });
}

describe("serve", () => {
  it("ответ отдаётся целиком, даже когда кормить нечем", async () => {
    const shot = await serve(endpoint, {}, USERS);

    expect(shot.result.status).toBe(200);
    expect(shot.result.body).toEqual(body);
    expect(shot.data).toBeUndefined();
    expect(shot.report).toBeUndefined();
  });

  it("адаптер пары находится сам, данные приезжают формой потребителя", async () => {
    saveAdapter();

    const shot = await serve(endpoint, {}, USERS);

    expect(shot.data).toEqual({
      title: "Курсы",
      items: [{ label: "USD" }, { label: "EUR" }],
    });
    expect(shot.result.body).toEqual(body);
    expect(shot.error).toBeNull();
  });

  it("адаптер чужой пары не берётся", async () => {
    saveAdapter();

    const shot = await serve(endpoint, {}, { ...USERS, consumer: ["component", "table"] });

    expect(shot.data).toBeUndefined();
  });

  it("отчёт приезжает вместе с данными — промах должно быть видно", async () => {
    saveAdapter();

    const shot = await serve(endpoint, {}, USERS);

    expect(shot.report?.converted).toBe(3);
  });
});

describe("сквозной прогон: связи сведены мышью, корень никто не задавал", () => {
  it("витрина получает записи, а не пустой список", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(sweep), {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      ),
    );

    presetsStore.actions.add(ADAPTER_KIND, "select", {
      root: "",
      rules: [
        { id: "r1", target: "/items/0/value", from: "/data/0/id" },
        { id: "r2", target: "/items/0/label", from: "/data/0/login" },
      ],
      providers: { api: { "preset-7": { "endpoint-3": {} } } },
      consumers: { component: { "user-card": {} } },
    });

    const shot = await serve(endpoint, {}, USERS);

    expect(shot.error).toBeNull();
    expect(shot.data).toEqual({
      items: [
        { value: 1, label: "ada" },
        { value: 2, label: "bob" },
      ],
    });
  });
});
