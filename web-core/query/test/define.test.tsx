import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { defineQuery, QueryClient, QueryClientProvider } from "../src/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mountWithClient(client: QueryClient, code: () => unknown): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <QueryClientProvider client={client}>{code() as never}</QueryClientProvider>, host);
  return host;
}

describe("defineQuery", () => {
  it("вызов по имени — обычный Promise, без Solid-owner (для loader)", async () => {
    const client = new QueryClient();
    const fetchPalettes = vi.fn(async () => ["light", "dark"]);
    const palettesQuery = defineQuery(client, () => ["palettes"], fetchPalettes);

    const data = await palettesQuery();

    expect(data).toEqual(["light", "dark"]);
    expect(fetchPalettes).toHaveBeenCalledTimes(1);
  });

  it(".use() — реактивный результат в реальном рендере, loading → data", async () => {
    const client = new QueryClient();
    const fetchContent = vi.fn(async (id: string) => ({ title: `hi ${id}` }));
    const contentQuery = defineQuery(client, (id: string) => ["content", id], fetchContent);

    function Content() {
      const query = contentQuery.use(() => "a");
      return <p>{query.isPending ? "loading" : query.data?.title}</p>;
    }

    const host = mountWithClient(client, () => <Content />);
    expect(host.textContent).toBe("loading");

    await vi.waitFor(() => expect(host.textContent).toBe("hi a"));
    expect(fetchContent).toHaveBeenCalledTimes(1);
  });

  it("вызов по имени в loader прогревает кэш — .use() в компоненте не запрашивает повторно", async () => {
    const client = new QueryClient();
    const fetchVariants = vi.fn(async (component: string) => [component, "b"]);
    const variantsQuery = defineQuery(
      client,
      (component: string) => ["variants", component],
      fetchVariants,
      { staleTime: Infinity },
    );

    await variantsQuery("button");

    function Variants() {
      const query = variantsQuery.use(() => "button");
      return <p>{query.isPending ? "loading" : query.data?.join(",")}</p>;
    }

    const host = mountWithClient(client, () => <Variants />);

    expect(host.textContent).toBe("button,b");
    expect(fetchVariants).toHaveBeenCalledTimes(1);
  });

  it(".use() с enabled: false не зовёт queryFn", async () => {
    const client = new QueryClient();
    const fetchContent = vi.fn(async (id: string) => ({ title: `hi ${id}` }));
    const contentQuery = defineQuery(client, (id: string) => ["content", id], fetchContent);

    function Content() {
      const query = contentQuery.use(
        () => "a",
        () => ({ enabled: false }),
      );
      return <p>{query.isPending ? "idle" : query.data?.title}</p>;
    }

    const host = mountWithClient(client, () => <Content />);

    await vi.waitFor(() => expect(host.textContent).toBe("idle"));
    expect(fetchContent).not.toHaveBeenCalled();
  });

  it("enabled реактивен — опции читаются на каждый такт, не замерзают при определении", async () => {
    const client = new QueryClient();
    const fetchContent = vi.fn(async (id: string) => ({ title: `hi ${id}` }));
    const contentQuery = defineQuery(client, (id: string) => ["content", id], fetchContent);
    const [chosen, setChosen] = createSignal(false);

    function Content() {
      const query = contentQuery.use(
        () => "a",
        () => ({ enabled: chosen() }),
      );
      return <p>{query.isPending ? "idle" : query.data?.title}</p>;
    }

    const host = mountWithClient(client, () => <Content />);
    expect(fetchContent).not.toHaveBeenCalled();

    setChosen(true);

    await vi.waitFor(() => expect(host.textContent).toBe("hi a"));
    expect(fetchContent).toHaveBeenCalledTimes(1);
  });

  it("placeholderData виден в query.data до резолва queryFn", async () => {
    const client = new QueryClient();
    let resolveContent: ((value: { title: string }) => void) | undefined;
    const fetchContent = vi.fn(
      () =>
        new Promise<{ title: string }>((resolve) => {
          resolveContent = resolve;
        }),
    );
    const contentQuery = defineQuery(client, (id: string) => ["content", id], fetchContent);

    function Content() {
      const query = contentQuery.use(
        () => "a",
        () => ({ placeholderData: { title: "пока пусто" } }),
      );
      return <p>{query.data?.title}</p>;
    }

    const host = mountWithClient(client, () => <Content />);
    expect(host.textContent).toBe("пока пусто");

    resolveContent?.({ title: "hi a" });

    await vi.waitFor(() => expect(host.textContent).toBe("hi a"));
  });
});
