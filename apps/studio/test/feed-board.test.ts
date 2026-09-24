// Доска кормления (`entities/feed/model/store.ts`).
//
// Ловим здесь одно свойство, и оно не про удобство, а про владение: в доске не должно оказываться
// чужих объектов. Еда приезжает из кэша запросов и сторов поставщиков, `solid-query` отдаёт её
// реактивными store-прокси, а состояние пишется через immer — а immer глубоко МОРОЗИТ всё, что
// в него попало. Заморозь он объект кэша — падает и чтение этого объекта через прокси, и сам кэш
// на ближайшем рефетче. Поэтому доска берёт еду себе копией.

import { describe, expect, it } from "vitest";
import { feedStoreOf } from "#/entities/feed";

describe("доска берёт еду себе", () => {
  it("исходный объект не попадает в состояние и не мёрзнет", () => {
    const store = feedStoreOf("еда-своя");
    const fromCache = { label: "из кэша", items: [{ value: "a" }] };

    store.actions.serve("preset", fromCache);
    const portion = store.selectors.portion();

    expect(portion).toEqual({ by: "preset", data: fromCache });
    expect(portion?.data).not.toBe(fromCache);
    // Вот ради этой строки всё и затевалось: заморозь immer объект кэша — упал бы кэш.
    expect(Object.isFrozen(fromCache)).toBe(false);
    expect(Object.isFrozen(fromCache.items[0])).toBe(false);
  });
});

describe("порция одна, последний поставщик вытесняет прежнего", () => {
  it("вторая подача заменяет первую целиком, а не ложится рядом", () => {
    const store = feedStoreOf("порция-одна");

    store.actions.serve("preset", { label: "из пресета" });
    store.actions.serve("manual", { label: "руками" });

    expect(store.selectors.portion()).toEqual({
      by: "manual",
      data: { label: "руками" },
    });
  });

  it("метка говорит, чем накормлено сейчас", () => {
    const store = feedStoreOf("метка");

    expect(store.selectors.portion()?.by).toBeUndefined();

    store.actions.serve("openapi", { label: "из ручки" });
    expect(store.selectors.portion()?.by).toBe("openapi");
  });
});

describe("доска у каждого компонента своя", () => {
  it("еда соседа не видна и не подменяется", () => {
    const button = feedStoreOf("button");
    const select = feedStoreOf("select");

    button.actions.serve("manual", { label: "кнопка" });

    expect(select.selectors.portion()).toBeUndefined();
    expect(button.selectors.portion()?.data).toEqual({ label: "кнопка" });
  });
});
