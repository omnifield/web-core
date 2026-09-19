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

function settings(host: HTMLElement): HTMLButtonElement[] {
  return [...host.querySelectorAll<HTMLButtonElement>('button[aria-label="Настроить"]')];
}

function dialog(): HTMLElement | undefined {
  const parts = [
    ...document.querySelectorAll<HTMLElement>('[data-scope="dialog"][data-part="content"]'),
  ];
  return parts.at(-1);
}

function saves(): HTMLButtonElement[] {
  return [...document.querySelectorAll("button")].filter((button) =>
    button.textContent?.includes("Сохранить"),
  );
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
    endpoints: [
      { id, method: "GET", url: `https://back/v2/${id}`, groupId: "g-все", params: [] },
    ],
    groups: [{ id: "g-все", name: "все" }],
    defs: {},
  };
}

function groupsOf(id: string): readonly { id: string; name: string }[] {
  const content = presetsStore.get().presets.find((preset) => preset.id === id)?.content;
  return asSchemaDocument(content)?.groups ?? [];
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
    presetsStore.actions.add("api", "Петстор", await parseSchema(petstore));
    presetsStore.actions.add("api", "Свой бэк", await parseSchema(petstore));

    const host = mount();

    expect(host.textContent).toContain("Петстор");
    expect(host.textContent).toContain("Свой бэк");
  });

  it("узел разворачивается в ручки пресета — без повторного разбора", async () => {
    const id = presetsStore.actions.add("api", "Петстор", await parseSchema(petstore));

    const host = mount();

    expect(host.textContent).toContain("pet");
    expect(settings(host)).toHaveLength(
      1 + groupsOf(id).length + endpointsOf(id).length,
    );
  });

  it("подмена содержимого пересобирает состав — копий ручек нет", async () => {
    const id = presetsStore.actions.add("api", "Петстор", { endpoints: [], defs: {} });

    const host = mount();
    expect(settings(host)).toHaveLength(1);

    presetsStore.actions.replace(id, await parseSchema(petstore));

    expect(host.textContent).toContain("pet");
    expect(settings(host)).toHaveLength(
      1 + groupsOf(id).length + endpointsOf(id).length,
    );
  });

  it("своя запись с битым содержимым названа вслух, а не показана пустой", () => {
    presetsStore.actions.add("api", "Кривая", { что: "то совсем другое" });

    const host = mount();

    expect(host.textContent).toContain("Пресет не похож на схему API");
  });

  it("запись чужого вида каталог не показывает и не ругается на неё", () => {
    presetsStore.actions.add("adapter", "Адаптер", { rules: [] });

    const host = mount();

    expect(host.textContent).not.toContain("Адаптер");
    expect(host.textContent).not.toContain("не похож на схему API");
    expect(host.textContent).toContain("Схем пока нет");
  });

  it("корзина на узле убирает ровно свой пресет", async () => {
    presetsStore.actions.add("api", "Первая", await parseSchema(petstore));
    const second = presetsStore.actions.add("api", "Вторая", await parseSchema(petstore));

    const host = mount();
    trash(host)[0]?.click();

    expect(presetsStore.get().presets.map((preset) => preset.id)).toEqual([second]);
    expect(host.textContent).not.toContain("Первая");
  });

  it("«+» на схеме заводит пустую группу первой — ручку в неё заводят отдельно", () => {
    const id = presetsStore.actions.add("api", "Свой бэк", oneEndpoint("users"));

    const host = mount();
    add(host)[0]?.click();

    expect(groupsOf(id)[0]).toMatchObject({ name: "Новая группа" });
    expect(groupsOf(id)).toHaveLength(2);
    expect(endpointsOf(id)).toHaveLength(1);
    expect(host.textContent).toContain("Новая группа");
  });

  it("второй «+» на схеме заводит ещё одну группу, а не переиспользует первую", () => {
    const id = presetsStore.actions.add("api", "Свой бэк", oneEndpoint("users"));

    const host = mount();
    add(host)[0]?.click();
    add(host)[0]?.click();

    expect(groupsOf(id)).toHaveLength(3);
    expect(new Set(groupsOf(id).map((group) => group.id)).size).toBe(3);
  });

  it("«+» на группе заводит ручку под ней, первой в группе", () => {
    const id = presetsStore.actions.add("api", "Свой бэк", oneEndpoint("users"));

    const host = mount();
    add(host)[1]?.click();

    expect(endpointsOf(id)).toHaveLength(2);
    expect(endpointsOf(id)[0]).toMatchObject({ url: "", groupId: "g-все" });
    expect(endpointsOf(id)[1]?.id).toBe("users");
  });

  it("у самой ручки «+» нет — глубже ручки заводить нечего", () => {
    presetsStore.actions.add("api", "Свой бэк", oneEndpoint("users"));

    const host = mount();

    expect(add(host)).toHaveLength(2);
  });

  it("корзина на группе уносит все ручки под ней, соседняя группа цела", () => {
    const id = presetsStore.actions.add("api", "Свой бэк", {
      endpoints: [
        { id: "пёс-раз", method: "GET", url: "/dog", groupId: "g-пёс", params: [] },
        { id: "пёс-два", method: "POST", url: "/dog", groupId: "g-пёс", params: [] },
        { id: "кот", method: "GET", url: "/cat", groupId: "g-кот", params: [] },
      ],
      groups: [
        { id: "g-пёс", name: "пёс" },
        { id: "g-кот", name: "кот" },
      ],
      defs: {},
    } satisfies SchemaDocument);

    const host = mount();
    trash(host)[1]?.click();

    expect(endpointsOf(id).map((endpoint) => endpoint.id)).toEqual(["кот"]);
  });

  it("«Настроить» есть у каждого узла — у схемы, у группы и у ручки", () => {
    presetsStore.actions.add("api", "Свой бэк", oneEndpoint("users"));

    const host = mount();

    expect(settings(host)).toHaveLength(3);
  });

  it("«Настроить» на ручке открывает форму её конфига, а не форму соседа", () => {
    presetsStore.actions.add("api", "Свой бэк", oneEndpoint("users"));

    const host = mount();
    settings(host)[2]?.click();

    const form = dialog();
    expect(form?.textContent).toContain("method");
    expect(form?.textContent).toContain("url");
    expect(form?.textContent).toContain("params");
    expect(saves()).toHaveLength(1);
  });

  it("«Настроить» на схеме и на группе открывает форму имени", () => {
    presetsStore.actions.add("api", "Свой бэк", oneEndpoint("users"));

    const host = mount();

    settings(host)[0]?.click();
    expect(dialog()?.textContent).toContain("name");
    expect(dialog()?.textContent).not.toContain("url");

    saves()[0]?.click();
    settings(host)[1]?.click();
    expect(dialog()?.textContent).toContain("name");
  });

  it("ответ ручки уходит наружу диспатчем, а не оседает в каталоге", async () => {
    stubFetch([{ id: 1, name: "Аня" }]);
    const id = presetsStore.actions.add("api", "Петстор", oneEndpoint("users"));
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
    presetsStore.actions.add("api", "Первая", oneEndpoint("users"));
    const second = presetsStore.actions.add("api", "Вторая", oneEndpoint("pets"));
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
