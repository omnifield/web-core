import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Schemas, schemasStore } from "../../../src/entities/schema";

let dispose: (() => void) | undefined;

beforeEach(() => {
  schemasStore.actions.hydrate([]);
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function mount(children?: Parameters<typeof Schemas>[0]["children"]): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <Schemas>{children}</Schemas>, host);
  return host;
}

describe("Schemas", () => {
  it("пустой список объясняет себя словами, а не пустотой", () => {
    const host = mount();

    expect(host.textContent).toContain("Схем пока нет");
  });

  it("показывает имена загруженных схем", () => {
    schemasStore.actions.add("petstore.yaml", "a");
    schemasStore.actions.add("вставленная", "b");

    const host = mount();

    expect(host.textContent).toContain("petstore.yaml");
    expect(host.textContent).toContain("вставленная");
  });

  it("новая схема доезжает в уже отрисованный список", () => {
    const host = mount();

    schemasStore.actions.add("поздняя", "a");

    expect(host.textContent).toContain("поздняя");
    expect(host.textContent).not.toContain("Схем пока нет");
  });

  it("что делать со схемой решает тот, кто монтирует список", () => {
    const id = schemasStore.actions.add("своя", "a");

    const host = mount((schema) => <button type="button">убрать {schema.id === id ? "своя" : "?"}</button>);

    expect(host.querySelector("button")?.textContent).toContain("убрать своя");
  });
});
