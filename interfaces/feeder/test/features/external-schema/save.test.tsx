import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { asSchemaDocument } from "../../../src/entities/openapi";
import { presetsStore } from "../../../src/entities/preset";
import { ExternalSchemaLoader } from "../../../src/features/external-schema";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(
  join(fixtureDir, "../../entities/openapi/fixtures/petstore.yaml"),
  "utf-8",
);

let dispose: (() => void) | undefined;

beforeEach(() => {
  presetsStore.actions.hydrate([]);
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

function fieldOf(host: HTMLElement, placeholder: string): HTMLInputElement | HTMLTextAreaElement {
  const input = host.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[placeholder="${placeholder}"]`);
  if (input === null) throw new Error(`нет поля «${placeholder}»`);
  return input;
}

function type(input: HTMLInputElement | HTMLTextAreaElement, text: string): void {
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

function load(host: HTMLElement, name: string, text: string): void {
  type(fieldOf(host, "Название пресета"), name);
  type(fieldOf(host, "PASTE"), text);
  loadButton(host).click();
}

describe("ExternalSchemaLoader", () => {
  it("чужой документ ложится в пресет уже разобранным, сырья не остаётся", async () => {
    const host = mount();

    load(host, "Петстор", petstore);

    await vi.waitFor(() => expect(presetsStore.get().presets).toHaveLength(1));

    const preset = presetsStore.get().presets[0];
    expect(preset?.label).toBe("Петстор");
    expect(preset?.kind).toBe("api");
    expect(asSchemaDocument(preset?.content)?.endpoints.length).toBeGreaterThan(0);
    expect(Object.keys(preset?.content as object).sort()).toEqual([
      "defs",
      "endpoints",
      "groups",
    ]);
  });

  it("нераспознанный документ пресетом не становится", async () => {
    const host = mount();

    load(host, "Кривая", "это не сваггер");

    await vi.waitFor(() => expect(host.textContent).toContain("Схема не распозналась"));
    expect(presetsStore.get().presets).toHaveLength(0);
  });

  it("без имени грузить нельзя — кнопка закрыта, а не тихий отказ", () => {
    const host = mount();

    type(fieldOf(host, "PASTE"), petstore);
    expect(loadButton(host).disabled).toBe(true);

    type(fieldOf(host, "Название пресета"), "Петстор");
    expect(loadButton(host).disabled).toBe(false);
  });

  it("после загрузки имя очищается — вторая схема не наследует чужое", async () => {
    const host = mount();

    load(host, "Первая", petstore);

    await vi.waitFor(() => expect(fieldOf(host, "Название пресета").value).toBe(""));
    expect(loadButton(host).disabled).toBe(true);
  });
});
