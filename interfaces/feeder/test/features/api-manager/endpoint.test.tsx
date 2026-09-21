import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { EndpointDescriptor, InvokeResult } from "../../../src/entities/openapi";
import { Endpoint } from "../../../src/features/api-manager";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  vi.unstubAllGlobals();
});

function endpoint(patch: Partial<EndpointDescriptor> = {}): EndpointDescriptor {
  return {
    id: "users",
    method: "GET",
    url: "https://back/v2/users",
    groupId: "g-users",
    params: [{ name: "limit", in: "query", required: true, schema: { type: "string" } }],
    ...patch,
  };
}

function stubFetch(handler: () => Promise<Response>) {
  const mock = vi.fn((_input: RequestInfo | URL, _init?: RequestInit) => handler());
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

function mount(
  item: EndpointDescriptor,
  onResult?: (result: InvokeResult) => void,
): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <Endpoint endpoint={item} defs={{}} onResult={onResult} />, host);
  return host;
}

function check(host: HTMLElement): HTMLButtonElement {
  const button = [...host.querySelectorAll("button")].find((item) =>
    item.textContent?.includes("Проверить"),
  );
  if (button === undefined) throw new Error("нет кнопки «Проверить»");
  return button;
}

describe("Endpoint", () => {
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

  it("ответ уходит наружу, а не показывается на месте", async () => {
    stubFetch(async () => jsonResponse([{ id: 1, name: "Аня" }]));
    const onResult = vi.fn();
    const host = mount(endpoint(), onResult);

    check(host).click();

    await vi.waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(onResult.mock.calls[0]?.[0]).toMatchObject({ status: 200, ok: true });
    expect(host.textContent).not.toContain("Аня");
  });

  it("не-2xx тоже ответ — уходит наружу, а не в отказ", async () => {
    stubFetch(async () => jsonResponse({ message: "нет такого" }, { status: 404 }));
    const onResult = vi.fn();
    const host = mount(endpoint(), onResult);

    check(host).click();

    await vi.waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(onResult.mock.calls[0]?.[0]).toMatchObject({ status: 404, ok: false });
    expect(host.textContent).not.toContain("Вызов не дошёл");
  });

  it("сорванный вызов наружу не уходит — ответа не было", async () => {
    stubFetch(async () => {
      throw new Error("сети нет");
    });
    const onResult = vi.fn();
    const host = mount(endpoint(), onResult);

    check(host).click();

    await vi.waitFor(() => expect(host.textContent).toContain("Вызов не дошёл"));
    expect(onResult).not.toHaveBeenCalled();
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
