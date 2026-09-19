import { createSignal } from "@web-core/solid";
import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it } from "vitest";

import { Endpoints, type EndpointDescriptor } from "../../../src/entities/openapi";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function endpoint(url: string, tag: string): EndpointDescriptor {
  return { method: "GET", url, tag, params: [] };
}

const petstore = [
  endpoint("https://back/pet", "pet"),
  endpoint("https://back/pet/findByStatus", "pet"),
  endpoint("https://back/store/order", "store"),
];

function node(host: HTMLElement, value: string): HTMLElement {
  const found = host.querySelector<HTMLElement>(`[data-part="item"][id$=":item:${value}"]`);
  if (found === null) throw new Error(`нет узла ${value}`);
  return found;
}

function mount(ui: () => ReturnType<typeof Endpoints>): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(ui, host);
  return host;
}

describe("Endpoints — узел переживает правку состава", () => {
  it("удаление ручки не пересобирает ни соседний тег, ни уцелевшие ручки", () => {
    const [endpoints, setEndpoints] = createSignal(petstore);
    const host = mount(() => <Endpoints endpoints={endpoints()} />);

    const store = node(host, "store");
    const kept = node(host, "GET https://back/pet");

    setEndpoints(petstore.filter((one) => one.url !== "https://back/pet/findByStatus"));

    expect(node(host, "store")).toBe(store);
    expect(node(host, "GET https://back/pet")).toBe(kept);
    expect(host.querySelector('[id$=":item:GET https://back/pet/findByStatus"]')).toBeNull();
  });

  it("новый объект с тем же ключом обновляет узел, а не заменяет его", () => {
    const [endpoints, setEndpoints] = createSignal(petstore);
    const host = mount(() => (
      <Endpoints endpoints={endpoints()}>
        {(one) => <span>{one().params.length} парам.</span>}
      </Endpoints>
    ));

    const kept = node(host, "GET https://back/pet");

    setEndpoints([
      { ...petstore[0]!, params: [{ name: "id", in: "query", required: false, schema: { type: "string" } }] },
      ...petstore.slice(1),
    ]);

    expect(node(host, "GET https://back/pet")).toBe(kept);
    expect(kept.textContent).toContain("1 парам.");
  });
});
