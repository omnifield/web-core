import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RawLoader } from "../../src/shared/ui";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function mount(onLoad: (raw: string) => void, disabled = false): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => <RawLoader label="Загрузить схему" onLoad={onLoad} disabled={disabled} />,
    host,
  );
  return host;
}

function paste(host: HTMLElement, text: string): void {
  const area = host.querySelector<HTMLTextAreaElement>("textarea");
  if (area === null) throw new Error("в компоненте нет поля под вставку");

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

describe("RawLoader", () => {
  it("вставленный текст уходит наружу как есть", () => {
    const onLoad = vi.fn();
    const host = mount(onLoad);

    paste(host, "swagger: '2.0'");
    loadButton(host).click();

    expect(onLoad).toHaveBeenCalledWith("swagger: '2.0'");
  });

  it("надпись кнопки — от потребителя: узел не знает, что грузят", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <RawLoader label="Загрузить адаптер" onLoad={vi.fn()} />, host);

    expect(host.textContent).toContain("Загрузить адаптер");
    expect(host.textContent).not.toContain("схем");
  });

  it("запрет снаружи держит кнопку закрытой даже при готовом тексте", () => {
    const host = mount(vi.fn(), true);

    paste(host, "swagger: '2.0'");

    expect(loadButton(host).disabled).toBe(true);
  });

  it("пока текста нет — грузить нечего, и кнопка это показывает", () => {
    const host = mount(vi.fn());

    expect(loadButton(host).disabled).toBe(true);

    paste(host, "swagger: '2.0'");

    expect(loadButton(host).disabled).toBe(false);
  });

  it("сам загрузчик ничего не хранит — только отдаёт текст", () => {
    const onLoad = vi.fn();
    const host = mount(onLoad);

    paste(host, "первый");
    loadButton(host).click();
    paste(host, "второй");
    loadButton(host).click();

    expect(onLoad.mock.calls.map(([raw]) => raw)).toEqual(["первый", "второй"]);
  });
});
