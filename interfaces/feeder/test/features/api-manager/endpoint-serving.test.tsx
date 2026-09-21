import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ADAPTER_KIND, defineUserKind } from "../../../src/entities/adapter";
import type { EndpointDescriptor } from "../../../src/entities/openapi";
import { presetsStore } from "../../../src/entities/preset";
import { API_USER, Endpoint, type Serving } from "../../../src/features/api-manager";

let dispose: (() => void) | undefined;

const COMPONENT_USER = defineUserKind("component", (name: string) => [name]);

const descriptor: EndpointDescriptor = {
  id: "e1",
  method: "GET",
  url: "https://back/rates",
  groupId: "g-rates",
  params: [],
};

const body = { data: [{ code: "USD" }] };

beforeEach(() => {
  presetsStore.actions.hydrate([]);
  presetsStore.actions.add(ADAPTER_KIND, "карточка", {
    root: "/data",
    rules: [{ id: "r1", target: "/items/0/label", from: "/code" }],
    providers: { api: { "preset-7": { e1: {} } } },
    consumers: { component: { "user-card": {} } },
  });

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

function mount(users?: { provider: readonly string[]; consumer: readonly string[] }) {
  const host = document.createElement("div");
  document.body.append(host);

  const served = vi.fn();
  const raw = vi.fn();

  dispose = render(
    () => (
      <Endpoint
        endpoint={descriptor}
        defs={{}}
        users={users}
        onResult={raw}
        onServing={served}
      />
    ),
    host,
  );

  return { host, served, raw };
}

const USERS = {
  provider: API_USER.path("preset-7", "e1"),
  consumer: COMPONENT_USER.path("user-card"),
};

describe("Endpoint с потребителем", () => {
  it("отдаёт собранную еду рядом с оригиналом ответа", async () => {
    const { host, served } = mount(USERS);

    host.querySelector("button")!.click();
    await vi.waitFor(() => expect(served).toHaveBeenCalled());

    const serving = served.mock.calls[0]![0] as Serving;

    expect(serving.result.body).toEqual(body);
    expect(serving.data).toEqual({ items: [{ label: "USD" }] });
    expect(serving.report?.converted).toBe(1);
  });

  it("без потребителя ведёт себя как раньше — только сырой ответ", async () => {
    const { host, served, raw } = mount();

    host.querySelector("button")!.click();
    await vi.waitFor(() => expect(raw).toHaveBeenCalled());

    expect(raw.mock.calls[0]![0]).toMatchObject({ status: 200, body });
    expect(served).not.toHaveBeenCalled();
  });
});
