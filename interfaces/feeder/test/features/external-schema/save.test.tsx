import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { schemasStore } from "../../../src/entities/schema";
import { ExternalSchemaLoader } from "../../../src/features/external-schema";

let dispose: (() => void) | undefined;

beforeEach(() => {
  schemasStore.actions.hydrate([]);
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function mount(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <ExternalSchemaLoader />, host);
  return host;
}

function fieldOf(host: HTMLElement, placeholder: string): HTMLInputElement {
  const input = host.querySelector<HTMLInputElement>(`input[placeholder="${placeholder}"]`);
  if (input === null) throw new Error(`нет поля «${placeholder}»`);
  return input;
}

function type(input: HTMLInputElement, text: string): void {
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function loadButton(host: HTMLElement): HTMLButtonElement {
  const button = [...host.querySelectorAll("button")].find((item) =>
    item.textContent?.includes("Загрузить схему"),
  );
  if (button === undefined) throw new Error("в компоненте нет кнопки загрузки");
  return button;
}

describe("ExternalSchemaLoader", () => {
  it("имя задаёт юзер, документ ложится в стор как есть", () => {
    const host = mount();

    type(fieldOf(host, "Название схемы"), "Петстор");
    type(fieldOf(host, "PASTE"), "swagger: '2.0'");
    loadButton(host).click();

    expect(schemasStore.get().schemas).toEqual([
      { id: expect.any(String), name: "Петстор", raw: "swagger: '2.0'" },
    ]);
  });

  it("без имени грузить нельзя — кнопка закрыта, а не тихий отказ", () => {
    const host = mount();

    type(fieldOf(host, "PASTE"), "swagger: '2.0'");
    expect(loadButton(host).disabled).toBe(true);

    type(fieldOf(host, "Название схемы"), "Петстор");
    expect(loadButton(host).disabled).toBe(false);
  });

  it("пробелы за имя не считаются", () => {
    const host = mount();

    type(fieldOf(host, "Название схемы"), "   ");
    type(fieldOf(host, "PASTE"), "swagger: '2.0'");

    expect(loadButton(host).disabled).toBe(true);
  });

  it("после загрузки имя очищается — вторая схема не наследует чужое", () => {
    const host = mount();

    type(fieldOf(host, "Название схемы"), "Первая");
    type(fieldOf(host, "PASTE"), "первый");
    loadButton(host).click();

    expect(fieldOf(host, "Название схемы").value).toBe("");
    expect(loadButton(host).disabled).toBe(true);
  });
});
