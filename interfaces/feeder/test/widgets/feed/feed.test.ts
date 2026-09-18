import { createRoot } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { bindingKey, bindingStoreOf } from "../../../src/entities/binding";
import { apiCatalogOf } from "../../../src/entities/openapi";
import { feedBindingOf, feedOf, useFeed } from "../../../src/widgets/feed";

const rules = [
  { target: "/value", from: "/id" },
  { target: "/text", from: "/name" },
];

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

function setup(component: string, apiId: string) {
  const catalog = apiCatalogOf(apiId);
  catalog.actions.addEndpoint({
    method: "GET",
    url: "https://back/v2/users",
    params: [],
  });

  const source = { apiId, endpointId: "GET https://back/v2/users" };
  const bindings = bindingStoreOf(component);
  bindings.actions.bind(source);
  bindings.actions.setRoot(bindingKey(source), "/data/items");
  bindings.actions.setRules(bindingKey(source), rules);

  return { bindings, source, id: bindingKey(source) };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("feedOf", () => {
  it("сквозь всё: ручка отвечает своей формой — компонент получает свою", async () => {
    stubFetch({ data: { items: [{ id: 1, name: "Аня" }, { id: 2, name: "Боря" }] } });
    const { bindings, id } = setup("Table", "main");

    const result = await feedOf(bindings.get().bindings.find((b) => bindingKey(b.source) === id)!);

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([
      { value: 1, text: "Аня" },
      { value: 2, text: "Боря" },
    ]);
  });

  it("ручки нет в каталоге — названная беда, а не пустой список", async () => {
    const result = await feedOf({
      source: { apiId: "unknown-api", endpointId: "GET /nope" },
      root: "",
      rules,
    });

    expect(result.rows).toEqual([]);
    expect(result.error).toMatch(/нет в каталоге/);
  });

  it("не-2xx — не еда, но статус назван", async () => {
    stubFetch({ message: "boom" }, { status: 500 });
    const { bindings, id } = setup("Table-500", "api-500");

    const result = await feedOf(bindings.get().bindings.find((b) => bindingKey(b.source) === id)!);

    expect(result.rows).toEqual([]);
    expect(result.error).toMatch(/500/);
  });

  it("оборванная сеть исключением наружу не выходит", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const { bindings, id } = setup("Table-offline", "api-offline");

    const result = await feedOf(bindings.get().bindings.find((b) => bindingKey(b.source) === id)!);

    expect(result.error).toMatch(/не ответила/);
  });
});

describe("feedBindingOf", () => {
  it("берёт сведённую привязку вперёд недоделанной", () => {
    const store = bindingStoreOf("Table-pick");
    store.actions.bind({ apiId: "a", endpointId: "GET /raw" });
    store.actions.bind({ apiId: "a", endpointId: "GET /fed" });
    store.actions.setRules(bindingKey({ apiId: "a", endpointId: "GET /fed" }), rules);

    expect(feedBindingOf("Table-pick")?.source.endpointId).toBe("GET /fed");
  });

  it("привязок нет — и еды нет", () => {
    expect(feedBindingOf("Table-empty")).toBeUndefined();
  });
});

describe("useFeed", () => {
  it("компонент называет себя — получает свою еду", async () => {
    stubFetch({ data: { items: [{ id: 3, name: "Вера" }] } });
    setup("ListBox", "api-hook");

    await createRoot(async (dispose) => {
      const { feed } = useFeed("ListBox");
      await vi.waitFor(() => expect(feed()).toBeDefined());

      expect(feed()?.rows).toEqual([{ value: 3, text: "Вера" }]);
      dispose();
    });
  });

  it("без привязки в сеть не ходит вовсе", async () => {
    const fetchMock = stubFetch({});

    await createRoot(async (dispose) => {
      const { feed } = useFeed("Untouched");
      await Promise.resolve();

      expect(feed()).toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
      dispose();
    });
  });
});
