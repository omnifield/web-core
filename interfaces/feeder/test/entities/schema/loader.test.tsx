import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SchemaLoader } from "../../../src/entities/schema";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function mount(onLoad: (raw: string) => void, disabled = false): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <SchemaLoader onLoad={onLoad} disabled={disabled} />, host);
  return host;
}

function paste(host: HTMLElement, text: string): void {
  const area = host.querySelector<HTMLInputElement>("input:not([type=file])");
  if (area === null) throw new Error("в компоненте нет поля под документ");

  area.value = text;
  area.dispatchEvent(new Event("input", { bubbles: true }));
}

function loadButton(host: HTMLElement): HTMLButtonElement {
  const button = [...host.querySelectorAll("button")].find((item) =>
    item.textContent?.includes("Загрузить схему"),
  );
  if (button === undefined) throw new Error("в компоненте нет кнопки загрузки");
  return button;
}

describe("SchemaLoader", () => {
  it("вставленный текст уходит наружу как есть", () => {
    const onLoad = vi.fn();
    const host = mount(onLoad);

    paste(host, "swagger: '2.0'");
    loadButton(host).click();

    expect(onLoad).toHaveBeenCalledWith("swagger: '2.0'");
  });

  it("запрет снаружи держит кнопку закрытой даже при готовом документе", () => {
    const host = mount(vi.fn(), true);

    paste(host, "swagger: '2.0'");

    expect(loadButton(host).disabled).toBe(true);
  });

  it("пока документа нет — грузить нечего, и кнопка это показывает", () => {
    const host = mount(vi.fn());

    expect(loadButton(host).disabled).toBe(true);

    paste(host, "swagger: '2.0'");

    expect(loadButton(host).disabled).toBe(false);
  });

  it("сам загрузчик ничего не хранит — только отдаёт документ", () => {
    const onLoad = vi.fn();
    const host = mount(onLoad);

    paste(host, "первый");
    loadButton(host).click();
    paste(host, "второй");
    loadButton(host).click();

    expect(onLoad.mock.calls.map(([raw]) => raw)).toEqual(["первый", "второй"]);
  });
});
