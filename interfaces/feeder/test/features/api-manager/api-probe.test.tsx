import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ADAPTER_KIND, defineUserKind } from "../../../src/entities/adapter";
import { API_KIND } from "../../../src/entities/openapi";
import { presetsStore } from "../../../src/entities/preset";
import { ApiCatalog, ApiProbe, type ApiProbeResult } from "../../../src/features/api-manager";

let dispose: (() => void) | undefined;

const COMPONENT_USER = defineUserKind("component", (name: string) => [name]);
const CARD = COMPONENT_USER.path("user-card");

const schema = {
  endpoints: [
    { id: "e1", method: "GET", url: "https://back/rates", groupId: "g1", params: [] },
    { id: "e2", method: "GET", url: "https://back/users", groupId: "g2", params: [] },
  ],
  groups: [
    { id: "g1", name: "rates" },
    { id: "g2", name: "users" },
  ],
  defs: {},
};

const body = { data: [{ code: "USD" }] };

let presetId = "";

beforeEach(() => {
  presetsStore.actions.hydrate([]);
  presetId = presetsStore.actions.add(API_KIND, "мой бэк", schema);

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
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function linkCardTo(endpointId: string): void {
  presetsStore.actions.add(ADAPTER_KIND, "карточка", {
    root: "/data",
    rules: [{ id: "r1", target: "/items/0/label", from: "/code" }],
    providers: { api: { [presetId]: { [endpointId]: {} } } },
    consumers: { component: { "user-card": {} } },
  });
}

function mount(onServing?: (event: ApiProbeResult) => void): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <ApiProbe consumer={CARD} onServing={onServing} />, host);
  return host;
}

describe("ApiProbe", () => {
  it("показывает только ручки, связанные с этим потребителем", () => {
    linkCardTo("e1");

    const host = mount();

    expect(host.textContent).toContain("https://back/rates");
    expect(host.textContent).not.toContain("https://back/users");
  });

  it("ручки идут плоским списком — ни схемы, ни групп в пробнике нет", () => {
    linkCardTo("e1");
    linkCardTo("e2");

    const host = mount();

    expect(host.textContent).toContain("GET https://back/rates");
    expect(host.textContent).toContain("GET https://back/users");
    expect(host.textContent).not.toContain("мой бэк");

    const nodes = host.querySelectorAll('[data-scope="accordion"][data-part="item"]');

    expect(nodes).toHaveLength(2);
  });

  it("связей нет — показывать нечего, и это сказано словами", () => {
    const host = mount();

    expect(host.textContent).toContain("Ручек, связанных с этим потребителем, нет");
  });

  it("правки состава нет: ни завести, ни убрать, ни настроить", () => {
    linkCardTo("e1");

    const labels = [...mount().querySelectorAll("button")].map(
      (one) => one.getAttribute("aria-label") ?? "",
    );

    expect(labels).not.toContain("Добавить");
    expect(labels).not.toContain("Убрать");
    expect(labels).not.toContain("Настроить");
  });

  it("а в обычном каталоге эти кнопки есть — иначе проверка выше ничего не значит", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <ApiCatalog />, host);

    const labels = [...host.querySelectorAll("button")].map(
      (one) => one.getAttribute("aria-label") ?? "",
    );

    expect(labels).toContain("Добавить");
    expect(labels).toContain("Убрать");
    expect(labels).toContain("Настроить");
  });
});
