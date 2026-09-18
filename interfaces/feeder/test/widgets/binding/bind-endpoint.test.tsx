import { z } from "@web-core/io";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bindingKey, bindingStoreOf, isFed } from "../../../src/entities/binding";
import type { OpenapiEndpoint } from "../../../src/entities/openapi";
import { BindEndpoint } from "../../../src/widgets/binding";

const endpoint: OpenapiEndpoint = {
  method: "GET",
  url: "https://back/v2/users",
  schema: z.object({}),
};

const consumers = [
  { name: "Table", input: z.object({ value: z.number(), text: z.string() }) },
];

const source = { apiId: "main", endpointId: "GET https://back/v2/users" };
const id = bindingKey(source);

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  vi.unstubAllGlobals();
});

function stubFetch(body: unknown, init: ResponseInit = {}) {
  const fetchMock = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
        ...init,
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => <BindEndpoint apiId="main" endpoint={endpoint} consumers={consumers} />,
    host,
  );
  return host;
}

function selects(host: HTMLElement): HTMLSelectElement[] {
  return [...host.querySelectorAll("select")];
}

function pick(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function check(host: HTMLElement) {
  const button = [...host.querySelectorAll("button")].find((item) =>
    item.textContent?.includes("Проверить"),
  );
  button?.click();
}

describe("BindEndpoint", () => {
  it("пока живого ответа нет — сводить нечего, и это сказано прямо", () => {
    const host = mount();

    pick(selects(host)[0], "Table");

    expect(host.textContent).toContain("нужен настоящий ответ");
    expect(isFed(bindingStoreOf("Table").get().bindings[0])).toBe(false);
  });

  it("сквозь экран: проверить → свести поле → правило в сторе привязок", async () => {
    stubFetch({ data: { items: [{ id: 1, name: "Аня" }] } });
    const host = mount();

    pick(selects(host)[0], "Table");
    check(host);
    await vi.waitFor(() => expect(host.textContent).toContain("Ответ: 200"));

    await vi.waitFor(() => expect(selects(host).length).toBeGreaterThan(1));
    pick(selects(host)[1], "/data/items");
    await vi.waitFor(() =>
      expect(bindingStoreOf("Table").get().bindings[0].root).toBe("/data/items"),
    );

    pick(selects(host)[2], "/id");

    const binding = bindingStoreOf("Table").get().bindings.find((item) => bindingKey(item.source) === id);
    expect(binding?.rules).toEqual([{ target: "/value", from: "/id" }]);
    expect(isFed(binding!)).toBe(true);
  });

  it("оборванная сеть — сообщение на экране, а не падение", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const host = mount();

    check(host);

    await vi.waitFor(() => expect(host.textContent).toContain("Ручка не ответила"));
  });
});
