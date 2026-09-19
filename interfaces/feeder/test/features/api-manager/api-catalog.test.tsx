import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  asSchemaDocument,
  parseSchema,
  type EndpointDescriptor,
  type SchemaDocument,
} from "../../../src/entities/openapi";
import { presetsStore } from "../../../src/entities/preset";
import {
  ApiCatalog,
  type ApiCatalogResult,
} from "../../../src/features/api-manager";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(
  join(fixtureDir, "../../entities/openapi/fixtures/petstore.yaml"),
  "utf-8",
);

let dispose: (() => void) | undefined;

beforeEach(() => {
  presetsStore.actions.hydrate([]);
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  vi.unstubAllGlobals();
});

function mount(onResult?: (event: ApiCatalogResult) => void): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <ApiCatalog onResult={onResult} />, host);
  return host;
}

function trash(host: HTMLElement): HTMLButtonElement[] {
  return [...host.querySelectorAll<HTMLButtonElement>('button[aria-label="Убрать"]')];
}

function add(host: HTMLElement): HTMLButtonElement[] {
  return [...host.querySelectorAll<HTMLButtonElement>('button[aria-label="Добавить"]')];
}

function endpointsOf(id: string): readonly EndpointDescriptor[] {
  const content = presetsStore.get().presets.find((preset) => preset.id === id)?.content;
  return asSchemaDocument(content)?.endpoints ?? [];
}

function checks(host: HTMLElement): HTMLButtonElement[] {
  return [...host.querySelectorAll("button")].filter((button) =>
    button.textContent?.includes("Проверить"),
  );
}

function oneEndpoint(id: string): SchemaDocument {
  return {
    endpoints: [{ id, method: "GET", url: `https://back/v2/${id}`, tag: "все", params: [] }],
    defs: {},
  };
}

function stubFetch(body: unknown) {
  const mock = vi.fn(
    async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", mock);
  return mock;
}

describe("ApiCatalog", () => {
  it("пустой каталог объясняет себя словами, а не пустотой", () => {
    const host = mount();

    expect(host.textContent).toContain("Схем пока нет");
  });

  it("каждый пресет — свой узел с его именем", async () => {
    presetsStore.actions.add("Петстор", await parseSchema(petstore));
    presetsStore.actions.add("Свой бэк", await parseSchema(petstore));

    const host = mount();

    expect(host.textContent).toContain("Петстор");
    expect(host.textContent).toContain("Свой бэк");
  });

  it("узел разворачивается в ручки пресета — без повторного разбора", async () => {
    presetsStore.actions.add("Петстор", await parseSchema(petstore));

    const host = mount();

    expect(host.textContent).toContain("pet");
    expect(host.textContent).toContain("GET https://petstore.swagger.io/v2/pet/findByStatus");
  });

  it("подмена содержимого пересобирает состав — копий ручек нет", async () => {
    const id = presetsStore.actions.add("Петстор", { endpoints: [], defs: {} });

    const host = mount();
    expect(host.textContent).not.toContain("findByStatus");

    presetsStore.actions.replace(id, await parseSchema(petstore));

    expect(host.textContent).toContain("GET https://petstore.swagger.io/v2/pet/findByStatus");
  });

  it("пресет не той формы назван вслух, а не показан пустым", () => {
    presetsStore.actions.add("Чужой", { что: "то совсем другое" });

    const host = mount();

    expect(host.textContent).toContain("Пресет не похож на схему API");
  });

  it("корзина на узле убирает ровно свой пресет", async () => {
    presetsStore.actions.add("Первая", await parseSchema(petstore));
    const second = presetsStore.actions.add("Вторая", await parseSchema(petstore));

    const host = mount();
    trash(host)[0]?.click();

    expect(presetsStore.get().presets.map((preset) => preset.id)).toEqual([second]);
    expect(host.textContent).not.toContain("Первая");
  });

  it("«+» на схеме заводит пустую ручку первой, в своём новом теге", () => {
    const id = presetsStore.actions.add("Свой бэк", oneEndpoint("users"));

    const host = mount();
    add(host)[0]?.click();

    const added = endpointsOf(id)[0];
    expect(added).toMatchObject({ method: "GET", url: "", params: [] });
    expect(added?.tag).toBeTypeOf("string");
    expect(added?.tag).not.toBe("все");
  });

  it("второй «+» на схеме заводит ещё один тег, а не копит ручки в первом", () => {
    const id = presetsStore.actions.add("Свой бэк", oneEndpoint("users"));

    const host = mount();
    add(host)[0]?.click();
    add(host)[0]?.click();

    const tags = endpointsOf(id).map((endpoint) => endpoint.tag);
    expect(new Set(tags).size).toBe(3);
    expect(endpointsOf(id)).toHaveLength(3);
  });

  it("«+» на теге заводит ручку под тем же тегом, первой в группе", () => {
    const id = presetsStore.actions.add("Свой бэк", oneEndpoint("users"));

    const host = mount();
    add(host)[1]?.click();

    expect(endpointsOf(id)).toHaveLength(2);
    expect(endpointsOf(id)[0]).toMatchObject({ url: "", tag: "все" });
    expect(endpointsOf(id)[1]?.id).toBe("users");
  });

  it("у самой ручки «+» нет — глубже ручки заводить нечего", () => {
    presetsStore.actions.add("Свой бэк", oneEndpoint("users"));

    const host = mount();

    expect(add(host)).toHaveLength(2);
  });

  it("корзина на теге уносит все ручки под ним, соседний тег цел", () => {
    const id = presetsStore.actions.add("Свой бэк", {
      endpoints: [
        { id: "пёс-раз", method: "GET", url: "/dog", tag: "пёс", params: [] },
        { id: "пёс-два", method: "POST", url: "/dog", tag: "пёс", params: [] },
        { id: "кот", method: "GET", url: "/cat", tag: "кот", params: [] },
      ],
      defs: {},
    } satisfies SchemaDocument);

    const host = mount();
    trash(host)[1]?.click();

    expect(endpointsOf(id).map((endpoint) => endpoint.id)).toEqual(["кот"]);
  });

  it("ответ ручки уходит наружу диспатчем, а не оседает в каталоге", async () => {
    stubFetch([{ id: 1, name: "Аня" }]);
    const id = presetsStore.actions.add("Петстор", oneEndpoint("users"));
    const onResult = vi.fn();

    const host = mount(onResult);
    checks(host)[0]?.click();

    await vi.waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(onResult.mock.calls[0]?.[0]).toMatchObject({
      presetId: id,
      endpoint: { id: "users" },
      result: { status: 200, ok: true, body: [{ id: 1, name: "Аня" }] },
    });
    expect(host.textContent).not.toContain("Аня");
  });

  it("в диспатче видно, чья именно ручка ответила", async () => {
    stubFetch({});
    presetsStore.actions.add("Первая", oneEndpoint("users"));
    const second = presetsStore.actions.add("Вторая", oneEndpoint("pets"));
    const onResult = vi.fn();

    const host = mount(onResult);
    checks(host)[1]?.click();

    await vi.waitFor(() => expect(onResult).toHaveBeenCalled());
    expect(onResult.mock.calls[0]?.[0]).toMatchObject({
      presetId: second,
      endpoint: { id: "pets" },
    });
  });
});
