import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PresetSaving } from "../../../src/entities/preset";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(props: Parameters<typeof PresetSaving>[0]): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <PresetSaving {...props} />, host);
  return host;
}

function input(host: HTMLElement): HTMLInputElement {
  return host.querySelector<HTMLInputElement>('[placeholder="Имя записи для ссылок"]')!;
}

function button(host: HTMLElement): HTMLButtonElement {
  return [...host.querySelectorAll("button")].find((one) =>
    one.textContent?.includes("Сохранить"),
  )!;
}

describe("PresetSaving", () => {
  it("набранное имя уходит наружу, своего состояния у узла нет", () => {
    const onName = vi.fn();
    const host = mount({ name: "", onName, onSave: () => undefined });

    const field = input(host);
    field.value = "users-list";
    field.dispatchEvent(new Event("input", { bubbles: true }));

    expect(onName).toHaveBeenCalledWith("users-list");
  });

  it("показывает то имя, которое ему дали", () => {
    const host = mount({ name: "users-list", onName: () => undefined, onSave: () => undefined });

    expect(input(host).value).toBe("users-list");
  });

  it("кнопка зовёт сохранение, а закрытая — молчит", () => {
    const onSave = vi.fn();

    const open = mount({ name: "users-list", onName: () => undefined, onSave });
    button(open).click();
    expect(onSave).toHaveBeenCalledTimes(1);

    dispose?.();
    const closed = mount({
      name: "",
      onName: () => undefined,
      onSave,
      disabled: true,
    });
    expect(button(closed).disabled).toBe(true);
    button(closed).click();
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("причина, по которой сохранять нельзя, показана словами", () => {
    const host = mount({
      name: "Users",
      onName: () => undefined,
      onSave: () => undefined,
      note: "Строчная латиница, цифры и дефис",
    });

    expect(host.textContent).toContain("Строчная латиница");
  });
});
