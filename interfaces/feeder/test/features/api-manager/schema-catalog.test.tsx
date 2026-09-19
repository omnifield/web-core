import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { parseSchema } from "../../../src/entities/openapi";
import { presetsStore } from "../../../src/entities/preset";
import { SchemaCatalog } from "../../../src/features/api-manager";

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
  dispose = render(() => <SchemaCatalog />, host);
  return host;
}

function trash(host: HTMLElement): HTMLButtonElement[] {
  return [...host.querySelectorAll<HTMLButtonElement>('button[aria-label="Убрать"]')];
}

describe("SchemaCatalog", () => {
  it("пустой каталог объясняет себя словами, а не пустотой", () => {
    const host = mount();

    expect(host.textContent).toContain("Схем пока нет");
  });

  it("каждый пресет — свой узел с его именем", async () => {
    presetsStore.actions.add("Петстор", await parseSchema(petstore));
    presetsStore.actions.add("Свой бэк", await parseSchema(petstore));

    const host = mount();

    expect(host.textContent).toContain("Петстор");
    expect(host.textContent).toContain("Свой бэк");
  });

  it("узел разворачивается в ручки пресета — без повторного разбора", async () => {
    presetsStore.actions.add("Петстор", await parseSchema(petstore));

    const host = mount();

    expect(host.textContent).toContain("pet");
    expect(host.textContent).toContain("GET https://petstore.swagger.io/v2/pet/findByStatus");
  });

  it("подмена содержимого пересобирает состав — копий ручек нет", async () => {
    const id = presetsStore.actions.add("Петстор", { endpoints: [], defs: {} });

    const host = mount();
    expect(host.textContent).not.toContain("findByStatus");

    presetsStore.actions.replace(id, await parseSchema(petstore));

    expect(host.textContent).toContain("GET https://petstore.swagger.io/v2/pet/findByStatus");
  });

  it("пресет не той формы назван вслух, а не показан пустым", () => {
    presetsStore.actions.add("Чужой", { что: "то совсем другое" });

    const host = mount();

    expect(host.textContent).toContain("Пресет не похож на схему API");
  });

  it("корзина на узле убирает ровно свой пресет", async () => {
    presetsStore.actions.add("Первая", await parseSchema(petstore));
    const second = presetsStore.actions.add("Вторая", await parseSchema(petstore));

    const host = mount();
    trash(host)[0]?.click();

    expect(presetsStore.get().presets.map((preset) => preset.id)).toEqual([second]);
    expect(host.textContent).not.toContain("Первая");
  });
});
