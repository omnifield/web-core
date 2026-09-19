import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Presets, presetsStore } from "../../../src/entities/preset";

let dispose: (() => void) | undefined;

beforeEach(() => {
  presetsStore.actions.hydrate([]);
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function mount(children?: Parameters<typeof Presets>[0]["children"]): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <Presets>{children}</Presets>, host);
  return host;
}

describe("Presets", () => {
  it("пустой список объясняет себя словами, а не пустотой", () => {
    const host = mount();

    expect(host.textContent).toContain("Пресетов пока нет");
  });

  it("показывает имена заведённых пресетов", () => {
    presetsStore.actions.add("petstore.yaml", "a");
    presetsStore.actions.add("вставленная", "b");

    const host = mount();

    expect(host.textContent).toContain("petstore.yaml");
    expect(host.textContent).toContain("вставленная");
  });

  it("новый пресет доезжает в уже отрисованный список", () => {
    const host = mount();

    presetsStore.actions.add("поздняя", "a");

    expect(host.textContent).toContain("поздняя");
    expect(host.textContent).not.toContain("Пресетов пока нет");
  });

  it("что делать с записью решает тот, кто монтирует список", () => {
    const id = presetsStore.actions.add("своя", "a");

    const host = mount((preset) => <button type="button">убрать {preset().id === id ? "своя" : "?"}</button>);

    expect(host.querySelector("button")?.textContent).toContain("убрать своя");
  });

  it("правка пресета обновляет карточку, а не пересобирает её", () => {
    const id = presetsStore.actions.add("была", "a");
    presetsStore.actions.add("соседняя", "b");

    const host = mount((preset) => <button type="button">{preset().name}</button>);
    const card = host.querySelector("button");

    presetsStore.actions.rename(id, "стала");

    expect(host.querySelector("button")).toBe(card);
    expect(card?.textContent).toBe("стала");
  });
});
