import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it, vi } from "vitest";

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

function endpoint(id: string, url: string, groupId?: string): EndpointDescriptor {
  return { id, method: "GET", url, groupId, params: [] };
}

const petstore: SchemaDocument = {
  endpoints: [
    endpoint("pet", "https://back/pet", "g-pet"),
    endpoint("by-status", "https://back/pet/findByStatus", "g-pet"),
    endpoint("order", "https://back/store/order", "g-store"),
  ],
  groups: [
    { id: "g-pet", name: "pet" },
    { id: "g-store", name: "store" },
  ],
  defs: {},
};

function mount(ui: () => ReturnType<typeof Endpoints>): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(ui, host);
  return host;
}

function buttons(host: HTMLElement, label: string): HTMLButtonElement[] {
  return [...host.querySelectorAll<HTMLButtonElement>(`button[aria-label="${label}"]`)];
}

describe("Endpoints", () => {
  it("состав не плоский: группы на одном уровне, ручки под ними", () => {
    const host = mount(() => (
      <Endpoints label="Петстор" document={petstore}>
        {(one) => <span>{one().url}</span>}
      </Endpoints>
    ));

    expect(host.textContent).toContain("Петстор");
    expect(host.textContent).toContain("pet");
    expect(host.textContent).toContain("store");
    expect(host.textContent).toContain("https://back/pet/findByStatus");
  });

  it("«добавить ручку» приходит с группой, в которую добавляют", () => {
    const onAddEndpoint = vi.fn();
    const host = mount(() => (
      <Endpoints document={petstore} onAddEndpoint={onAddEndpoint} />
    ));

    buttons(host, "Добавить")[1]?.click();

    expect(onAddEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ id: "g-store", name: "store" }),
    );
  });

  it("удалить можно на всех трёх уровнях — схему, группу и ручку", () => {
    const onRemove = vi.fn();
    const onRemoveGroup = vi.fn();
    const onRemoveEndpoint = vi.fn();
    const host = mount(() => (
      <Endpoints
        label="Петстор"
        document={petstore}
        onRemove={onRemove}
        onRemoveGroup={onRemoveGroup}
        onRemoveEndpoint={onRemoveEndpoint}
      />
    ));

    const trash = buttons(host, "Убрать");
    trash[0]?.click();
    expect(onRemove).toHaveBeenCalled();

    trash[1]?.click();
    expect(onRemoveGroup).toHaveBeenCalledWith(expect.objectContaining({ id: "g-pet" }));

    trash[2]?.click();
    expect(onRemoveEndpoint).toHaveBeenCalledWith(petstore.endpoints[0]);
  });

  it("без колбэков кнопок нет — состав можно показать и только на чтение", () => {
    const host = mount(() => <Endpoints label="Петстор" document={petstore} />);

    expect(buttons(host, "Добавить")).toHaveLength(0);
    expect(buttons(host, "Убрать")).toHaveLength(0);
  });

  it("пустая группа видна на экране — в неё и добавляют первую ручку", () => {
    const host = mount(() => (
      <Endpoints
        document={{ endpoints: [], groups: [{ id: "g-new", name: "Новая группа" }], defs: {} }}
      />
    ));

    expect(host.textContent).toContain("Новая группа");
  });

  it("что внутри ручки — решает тот, кто монтирует состав", () => {
    const host = mount(() => (
      <Endpoints document={petstore}>
        {(item) => <span>параметры {item().url}</span>}
      </Endpoints>
    ));

    expect(host.textContent).toContain("параметры https://back/store/order");
  });
});
