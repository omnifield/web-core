import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { schemasStore } from "../../../src/entities/schema";
import { SchemaCatalog } from "../../../src/features/api-manager";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(
  join(fixtureDir, "../../entities/openapi/fixtures/petstore.yaml"),
  "utf-8",
);

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

  it("каждая загруженная схема — свой узел с её именем", () => {
    schemasStore.actions.add("Петстор", "a");
    schemasStore.actions.add("Свой бэк", "b");

    const host = mount();

    expect(host.textContent).toContain("Петстор");
    expect(host.textContent).toContain("Свой бэк");
    expect(host.textContent).not.toContain("Схем пока нет");
  });

  it("новая схема доезжает в уже отрисованный каталог", () => {
    const host = mount();

    schemasStore.actions.add("поздняя", "a");

    expect(host.textContent).toContain("поздняя");
  });

  it("корзина на узле убирает ровно свою схему", () => {
    schemasStore.actions.add("Первая", "a");
    const second = schemasStore.actions.add("Вторая", "b");

    const host = mount();
    trash(host)[0]?.click();

    expect(schemasStore.get().schemas.map((schema) => schema.id)).toEqual([second]);
    expect(host.textContent).not.toContain("Первая");
    expect(host.textContent).toContain("Вторая");
  });

  it("узел схемы разворачивается в её ручки — состав считается из оригинала", async () => {
    schemasStore.actions.add("Петстор", petstore);

    const host = mount();

    await vi.waitFor(() => expect(host.textContent).toContain("pet"));
    expect(host.textContent).toContain("GET https://petstore.swagger.io/v2/pet/findByStatus");
  });

  it("нераспознанный документ говорит об этом на своём узле", async () => {
    schemasStore.actions.add("Кривая", "это не сваггер");

    const host = mount();

    await vi.waitFor(() => expect(host.textContent).toContain("Схема не распозналась"));
    expect(host.textContent).toContain("Кривая");
  });

  it("правка оригинала пересобирает состав — копии ручек нигде нет", async () => {
    const id = schemasStore.actions.add("Петстор", "это не сваггер");

    const host = mount();
    await vi.waitFor(() => expect(host.textContent).toContain("Схема не распозналась"));

    schemasStore.actions.replace(id, petstore);

    await vi.waitFor(() =>
      expect(host.textContent).toContain("GET https://petstore.swagger.io/v2/pet/findByStatus"),
    );
    expect(host.textContent).not.toContain("Схема не распозналась");
  });
});
