// Чем накормлен стенд (`features/component-manager/model/store.ts`).
//
// Ловим здесь одно свойство, и оно не про удобство, а про владение: в сторе стенда не должно
// оказываться чужих объектов. Пресеты живут в кэше запросов, `solid-query` отдаёт их реактивными
// store-прокси, а стор пишется через immer — а immer глубоко МОРОЗИТ всё, что попало в состояние.
// Заморозь он объект кэша — падает и чтение этого объекта через прокси, и сам кэш на ближайшем
// рефетче. Поэтому пресет хранится ссылкой (именем), а ручная правка берётся себе копией.

import { describe, expect, it } from "vitest";
import { componentManagerStoreOf } from "#/features/component-manager";

describe("пресет хранится ссылкой, а не телом", () => {
  it("в состоянии лежит имя пресета — данных там нет", () => {
    const store = componentManagerStoreOf("пресет-ссылкой");

    store.actions.setFeedPreset("delivery");

    expect(store.selectors.standFeed()).toEqual({
      kind: "preset",
      name: "delivery",
    });
  });

  it("ручная правка вытесняет пресет, а не ложится рядом", () => {
    const store = componentManagerStoreOf("корм-один");

    store.actions.setFeedPreset("delivery");
    store.actions.setFeedData({ label: "своё" });
    expect(store.selectors.standFeed()?.kind).toBe("manual");

    store.actions.setFeedPreset("delivery");
    expect(store.selectors.standFeed()?.kind).toBe("preset");
  });
});

describe("ручные данные стор забирает себе", () => {
  it("исходный объект не попадает в состояние и не мёрзнет", () => {
    const store = componentManagerStoreOf("ручное-своё");
    const fromCache = { label: "из кэша", items: [{ value: "a" }] };

    store.actions.setFeedData(fromCache);
    const feed = store.selectors.standFeed();

    expect(feed).toEqual({ kind: "manual", data: fromCache });
    expect(feed?.kind === "manual" && feed.data).not.toBe(fromCache);
    // Вот ради этой строки всё и затевалось: заморозь immer объект кэша — упал бы кэш.
    expect(Object.isFrozen(fromCache)).toBe(false);
    expect(Object.isFrozen(fromCache.items[0])).toBe(false);
  });

  it("правка одной ячейки не трогает корм всего стенда", () => {
    const store = componentManagerStoreOf("ячейка-и-стенд");
    const cell = { primary: 1, group: "" };

    store.actions.setFeedPreset("delivery");
    store.actions.setFeedData({ label: "только эта ячейка" }, cell);

    expect(store.selectors.standFeed()).toEqual({
      kind: "preset",
      name: "delivery",
    });
    expect(store.selectors.feed(cell)).toEqual({
      kind: "manual",
      data: { label: "только эта ячейка" },
    });
  });
});
