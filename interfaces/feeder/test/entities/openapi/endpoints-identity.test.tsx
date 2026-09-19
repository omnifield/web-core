import { createSignal } from "@web-core/solid";
import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it } from "vitest";

import {
  Endpoints,
  type EndpointDescriptor,
  type SchemaDocument,
} from "../../../src/entities/openapi";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function endpoint(id: string, url: string, groupId: string): EndpointDescriptor {
  return { id, method: "GET", url, groupId, params: [] };
}

const petstore: SchemaDocument = {
  endpoints: [
    endpoint("e-pet", "https://back/pet", "g-pet"),
    endpoint("e-by-status", "https://back/pet/findByStatus", "g-pet"),
    endpoint("e-order", "https://back/store/order", "g-store"),
  ],
  groups: [
    { id: "g-pet", name: "pet" },
    { id: "g-store", name: "store" },
  ],
  defs: {},
};

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
  it("удаление ручки не пересобирает ни соседнюю группу, ни уцелевшие ручки", () => {
    const [document, setDocument] = createSignal(petstore);
    const host = mount(() => <Endpoints document={document()} />);

    const store = node(host, "g-store");
    const kept = node(host, "e-pet");

    setDocument({
      ...petstore,
      endpoints: petstore.endpoints.filter((one) => one.id !== "e-by-status"),
    });

    expect(node(host, "g-store")).toBe(store);
    expect(node(host, "e-pet")).toBe(kept);
    expect(host.querySelector('[id$=":item:e-by-status"]')).toBeNull();
  });

  it("переименование группы не сносит её узел — тождество держит айди, а не имя", () => {
    const [document, setDocument] = createSignal(petstore);
    const host = mount(() => <Endpoints document={document()} />);

    const kept = node(host, "g-pet");

    setDocument({
      ...petstore,
      groups: [{ id: "g-pet", name: "питомцы" }, ...petstore.groups.slice(1)],
    });

    expect(node(host, "g-pet")).toBe(kept);
    expect(kept.textContent).toContain("питомцы");
  });

  it("новый объект с тем же айди обновляет узел, а не заменяет его", () => {
    const [document, setDocument] = createSignal(petstore);
    const host = mount(() => (
      <Endpoints document={document()}>
        {(one) => <span>{one().params.length} парам.</span>}
      </Endpoints>
    ));

    const kept = node(host, "e-pet");

    setDocument({
      ...petstore,
      endpoints: [
        {
          ...petstore.endpoints[0]!,
          params: [{ name: "id", in: "query", required: false, schema: { type: "string" } }],
        },
        ...petstore.endpoints.slice(1),
      ],
    });

    expect(node(host, "e-pet")).toBe(kept);
    expect(kept.textContent).toContain("1 парам.");
  });

  it("правка урла не трогает узел — тождество держит айди, а не метод с урлом", () => {
    const [document, setDocument] = createSignal(petstore);
    const host = mount(() => (
      <Endpoints document={document()}>{(one) => <span>{one().url}</span>}</Endpoints>
    ));

    const kept = node(host, "e-pet");

    setDocument({
      ...petstore,
      endpoints: [
        { ...petstore.endpoints[0]!, url: "https://back/pets" },
        ...petstore.endpoints.slice(1),
      ],
    });

    expect(node(host, "e-pet")).toBe(kept);
    expect(kept.textContent).toContain("https://back/pets");
  });
});
