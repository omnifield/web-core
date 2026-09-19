import { z } from "@web-core/io";
import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Endpoints, type OpenapiEndpoint } from "../../../src/entities/openapi";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function endpoint(url: string, tag?: string): OpenapiEndpoint {
  return { method: "GET", url, tag, schema: z.object({}) };
}

const petstore = [
  endpoint("https://back/pet", "pet"),
  endpoint("https://back/pet/findByStatus", "pet"),
  endpoint("https://back/store/order", "store"),
];

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
  it("состав не плоский: теги на одном уровне, ручки под ними", () => {
    const host = mount(() => <Endpoints label="Петстор" endpoints={petstore} />);

    expect(host.textContent).toContain("Петстор");
    expect(host.textContent).toContain("pet");
    expect(host.textContent).toContain("store");
    expect(host.textContent).toContain("GET https://back/pet/findByStatus");
  });

  it("«добавить ручку» приходит с тегом, в который добавляют", () => {
    const onAddEndpoint = vi.fn();
    const host = mount(() => (
      <Endpoints endpoints={petstore} onAddEndpoint={onAddEndpoint} />
    ));

    buttons(host, "Добавить")[1]?.click();

    expect(onAddEndpoint).toHaveBeenCalledWith("store");
  });

  it("удалить можно на всех трёх уровнях — схему, тег и ручку", () => {
    const onRemove = vi.fn();
    const onRemoveTag = vi.fn();
    const onRemoveEndpoint = vi.fn();
    const host = mount(() => (
      <Endpoints
        label="Петстор"
        endpoints={petstore}
        onRemove={onRemove}
        onRemoveTag={onRemoveTag}
        onRemoveEndpoint={onRemoveEndpoint}
      />
    ));

    const trash = buttons(host, "Убрать");
    trash[0]?.click();
    expect(onRemove).toHaveBeenCalled();

    trash[1]?.click();
    expect(onRemoveTag).toHaveBeenCalledWith("pet");

    trash[2]?.click();
    expect(onRemoveEndpoint).toHaveBeenCalledWith(petstore[0]);
  });

  it("без колбэков кнопок нет — состав можно показать и только на чтение", () => {
    const host = mount(() => <Endpoints label="Петстор" endpoints={petstore} />);

    expect(buttons(host, "Добавить")).toHaveLength(0);
    expect(buttons(host, "Убрать")).toHaveLength(0);
  });

  it("что внутри ручки — решает тот, кто монтирует состав", () => {
    const host = mount(() => (
      <Endpoints endpoints={petstore}>
        {(item) => <span>параметры {item().url}</span>}
      </Endpoints>
    ));

    expect(host.textContent).toContain("параметры https://back/store/order");
  });
});
