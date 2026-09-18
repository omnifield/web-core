import { z } from "@web-core/io";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { OpenapiEndpoint } from "../../../src/entities/openapi";
import { EndpointCall } from "../../../src/features/api-manager";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  vi.unstubAllGlobals();
});

function endpoint(patch: Partial<OpenapiEndpoint> = {}): OpenapiEndpoint {
  return {
    method: "GET",
    url: "https://back/v2/users",
    schema: z.object({ limit: z.string() }),
    ...patch,
  };
}

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

function mount(item: OpenapiEndpoint): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <EndpointCall endpoint={item} />, host);
  return host;
}

function check(host: HTMLElement): HTMLButtonElement {
  const button = [...host.querySelectorAll("button")].find((item) =>
    item.textContent?.includes("Проверить"),
  );
  if (button === undefined) throw new Error("нет кнопки «Проверить»");
  return button;
}

describe("EndpointCall", () => {
  it("рисует форму параметров по схеме ручки", () => {
    const host = mount(endpoint());

    expect(host.textContent).toContain("limit");
    expect(host.querySelector("input")).not.toBeNull();
  });

  it("настроенный параметр уходит в запрос", async () => {
    const fetchMock = stubFetch(async () => jsonResponse([]));
    const host = mount(endpoint());

    const input = host.querySelector("input");
    if (input === null) throw new Error("нет поля параметра");
    input.value = "10";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    check(host).click();

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("limit=10");
  });

  it("ответ показывается со статусом и телом", async () => {
    stubFetch(async () => jsonResponse([{ id: 1, name: "Аня" }]));
    const host = mount(endpoint());

    check(host).click();

    await vi.waitFor(() => expect(host.textContent).toContain("Ответ: 200"));
    expect(host.textContent).toContain("Аня");
  });

  it("не-2xx показывается как ответ, а не как несостоявшийся вызов", async () => {
    stubFetch(async () => jsonResponse({ message: "нет такого" }, { status: 404 }));
    const host = mount(endpoint());

    check(host).click();

    await vi.waitFor(() => expect(host.textContent).toContain("Ответ: 404"));
    expect(host.textContent).not.toContain("Вызов не дошёл");
  });

  it("сорванный транспорт назван словами", async () => {
    stubFetch(async () => {
      throw new Error("сети нет");
    });
    const host = mount(endpoint());

    check(host).click();

    await vi.waitFor(() => expect(host.textContent).toContain("Вызов не дошёл: сети нет"));
  });
});
