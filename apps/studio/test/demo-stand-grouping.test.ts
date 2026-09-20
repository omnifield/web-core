// Группировка primary-оси и применимость фильтра (`features/demo-stand`).
//
// Две стороны, обе тихие:
//
// 1. Фильтр по тегам осмыслен только на оси вариантов — теги живут в `VariantSummary.tags`, у
//    сборок такого поля нет. Раньше контрол оставался активным и на оси сборок: нажатие честно
//    меняло `filterMode`, раскладка честно шла группировать, все элементы попадали в один
//    безымянный бакет — и на экране не менялось ничего. Кнопка, которая гарантированно ничего
//    не делает, хуже отсутствующей: она врёт про наличие возможности.
//
// 2. Ячейка адресуется парой «группа + позиция». Один вариант с двумя тегами рождается в двух
//    группах с ОДНОЙ позицией — если ключ состояния собран без группы, эти две ячейки становятся
//    одной: переключаешь secondary в секции «primary», меняется и в секции «danger», которой на
//    экране может быть вообще не видно.

import { describe, expect, it } from "vitest";
import {
  demoStandStoreOf,
  filterAppliesTo,
} from "#/features/demo-stand";
import { groupByTags } from "#/features/demo-stand/lib/group";

describe("фильтр по тегам знает, на какой оси он применим", () => {
  it("на оси вариантов применим, на оси сборок — нет", () => {
    expect(filterAppliesTo("tags", "variant")).toBe(true);
    expect(filterAppliesTo("tags", "assembly")).toBe(false);
  });

  it("`none` применим на любой оси — сбросу всегда есть куда приземлиться", () => {
    expect(filterAppliesTo("none", "variant")).toBe(true);
    expect(filterAppliesTo("none", "assembly")).toBe(true);
  });

  it("смена оси уносит с собой неприменимый фильтр, а не оставляет его в состоянии", () => {
    const store = demoStandStoreOf("фильтр-и-ось");
    store.actions.setFilterMode("tags");
    expect(store.get().filterMode).toBe("tags");

    store.actions.setAxisMode("assembly");

    expect(store.get().filterMode).toBe("none");
  });

  it("применимый фильтр смена оси не трогает", () => {
    const store = demoStandStoreOf("фильтр-переживает-ось");
    store.actions.setAxisMode("assembly");
    store.actions.setFilterMode("none");

    store.actions.setAxisMode("variant");

    expect(store.get().filterMode).toBe("none");
  });
});

describe("группировка по тегам не плодит дублей", () => {
  it("повторённый тег не кладёт элемент в свой же бакет дважды", () => {
    const groups = groupByTags([{ name: "solid" }], () => [
      "primary",
      "primary",
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("primary");
    expect(groups[0]?.items).toHaveLength(1);
  });

  it("два разных тега кладут элемент в обе группы — это не дубль, а две проекции", () => {
    const groups = groupByTags([{ name: "solid" }], () => [
      "primary",
      "danger",
    ]);

    expect(groups.map((group) => group.label)).toEqual(["primary", "danger"]);
    expect(groups.every((group) => group.items.length === 1)).toBe(true);
  });
});

describe("ячейка адресуется парой «группа + позиция»", () => {
  // Одна и та же позиция primary-оси, показанная в двух тег-группах: на экране это две разные
  // карточки в двух разных секциях.
  const inPrimaryTag = { primary: 1, group: "primary" };
  const inDangerTag = { primary: 1, group: "danger" };

  it("выбор secondary в одной группе не меняет ту же позицию в другой", () => {
    const store = demoStandStoreOf("позиция-в-двух-группах");

    store.actions.setSecondaryIndexOfCell(2, inPrimaryTag);

    expect(store.selectors.storedSecondaryIndex(inPrimaryTag)).toBe(2);
    expect(store.selectors.storedSecondaryIndex(inDangerTag)).toBe(0);
  });

  it("вид ячейки тоже не протекает между группами", () => {
    const store = demoStandStoreOf("вид-в-двух-группах");

    store.actions.setViewMode("feed", inPrimaryTag);

    expect(store.selectors.viewMode(inPrimaryTag)).toBe("feed");
    expect(store.selectors.viewMode(inDangerTag)).toBe("form");
  });
});
