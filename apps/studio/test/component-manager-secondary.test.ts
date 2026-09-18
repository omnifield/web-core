// Разрешение «ячейка → показанный элемент» (`features/component-manager/lib/axes.ts`) и адресация
// хранимого выбора (`model/store.ts`). Два разных вопроса, и с недавних пор они разведены по
// разным местам: списки принадлежат компоненту (`entities/component`), а `axisMode`/`secondaryIndex`
// — стенду. Поэтому арифметика здесь проверяется чистой, без стора, а стор — без списков.
//
// Сторона, которую ловим арифметикой: число `secondaryIndex` живёт отдельно от списка, в который
// указывает, а список меняется — сменой оси (secondary становится ДРУГОЙ осью) и асинхронной
// загрузкой (приезжает и умеет становиться короче). Индекс вне границ — не исключение, а
// `undefined` из `variantIn`/`assemblyIn`, на котором `Show` не рисует ничего: ячейка молча
// пустая, без ошибки и без объяснения.

import { describe, expect, it } from "vitest";
import { componentDescriptorOf } from "@web-core/ui/component-info";
import { componentManagerStoreOf } from "#/features/component-manager";
import {
  type Axes,
  assemblyIn,
  secondaryIndexIn,
  variantIn,
} from "#/features/component-manager/lib/axes";

/** Настоящие сборки из кита, размноженные до нужной длины: форма данных боевая, длина под
 *  контролем теста — ровно то, что он проверяет. Варианты структурны, их можно написать руками. */
function axesOf(variantCount: number, assemblyCount: number): Axes {
  const sample = componentDescriptorOf("button").editorInfo?.assemblies[0];
  if (sample === undefined) {
    throw new Error(
      "у `button` в ките нет ни одной сборки — размножать нечего",
    );
  }

  return {
    variants: Array.from({ length: variantCount }, (_item, index) => ({
      name: `variant-${index}`,
      tags: [],
    })),
    assemblies: Array.from({ length: assemblyCount }, (_item, index) => ({
      ...sample,
      name: `assembly-${index}`,
    })),
  };
}

const cell = { primary: 1, group: "" };

describe("границу списка держит разрешение, а не вид", () => {
  it("индекс за границей отдаётся последним существующим, а не как есть", () => {
    expect(secondaryIndexIn(axesOf(5, 3), "variant", 7)).toBe(2);
  });

  it("на пустом списке отдаётся ноль, а не отрицательный индекс", () => {
    expect(secondaryIndexIn(axesOf(5, 0), "variant", 7)).toBe(0);
  });

  it("выбор внутри границ не трогают", () => {
    expect(secondaryIndexIn(axesOf(5, 3), "variant", 1)).toBe(1);
  });

  it("границу задаёт тот список, который сейчас secondary", () => {
    const axes = axesOf(2, 9);

    // primary — варианты, значит secondary — сборки, их девять.
    expect(secondaryIndexIn(axes, "variant", 8)).toBe(8);
    // primary — сборки, значит secondary — варианты, их два.
    expect(secondaryIndexIn(axes, "assembly", 8)).toBe(1);
  });
});

describe("по primary-оси ячейка стоит на своём месте, по secondary — на общем выборе", () => {
  it("на оси вариантов вариант берётся из ячейки, а сборка из выбора", () => {
    const axes = axesOf(5, 3);

    expect(variantIn(axes, "variant", cell, 2)?.name).toBe("variant-1");
    expect(assemblyIn(axes, "variant", cell, 2)?.name).toBe("assembly-2");
  });

  it("на оси сборок роли меняются местами", () => {
    const axes = axesOf(5, 3);

    expect(assemblyIn(axes, "assembly", cell, 2)?.name).toBe("assembly-1");
    expect(variantIn(axes, "assembly", cell, 2)?.name).toBe("variant-2");
  });

  it("список короче выбора — показывается последний элемент, а не пустота", () => {
    const axes = axesOf(5, 2);

    expect(assemblyIn(axes, "variant", cell, 4)?.name).toBe("assembly-1");
  });
});

describe("стор адресует хранимый выбор, ничего не зная о списках", () => {
  it("ячейка и группа — разные адреса, даже если тег назван как позиция", () => {
    const store = componentManagerStoreOf("ключ-не-сталкивается");
    const tagged = { primary: 0, group: "0" };

    store.actions.setSecondaryIndexOfCell(1, tagged);
    expect(store.selectors.storedSecondaryIndex(tagged)).toBe(1);

    // В matrix ячейка слушает свою группу. Группа зовётся "0" так же, как позиция первой ячейки,
    // но это другой выбор: он ещё не сделан.
    store.actions.setLayoutMode("matrix");
    expect(store.selectors.storedSecondaryIndex(tagged)).toBe(0);

    store.actions.setLayoutMode("grid");
    expect(store.selectors.storedSecondaryIndex(tagged)).toBe(1);
  });

  it("смена оси не переносит выбор в чужой список и возвращает свой обратно", () => {
    const store = componentManagerStoreOf("смена-оси");
    store.actions.setSecondaryIndexOfCell(2, cell);

    store.actions.setAxisMode("assembly");
    expect(store.selectors.storedSecondaryIndex(cell)).toBe(0);

    store.actions.setAxisMode("variant");
    expect(store.selectors.storedSecondaryIndex(cell)).toBe(2);
  });

  it("выбор на обёртке доезжает до всех её слайдов и не трогает соседнюю", () => {
    const store = componentManagerStoreOf("обёртка-адресует-группу");
    store.actions.setLayoutMode("matrix");

    store.actions.setSecondaryIndexOfGroup(2, "primary");

    expect(
      store.selectors.storedSecondaryIndex({ primary: 0, group: "primary" }),
    ).toBe(2);
    expect(
      store.selectors.storedSecondaryIndex({ primary: 1, group: "primary" }),
    ).toBe(2);
    expect(
      store.selectors.storedSecondaryIndex({ primary: 0, group: "danger" }),
    ).toBe(0);
  });

  it("групповой выбор виден контролу обёртки без единой ячейки на руках", () => {
    const store = componentManagerStoreOf("контрол-без-ячейки");

    store.actions.setSecondaryIndexOfGroup(1, "primary");

    expect(store.selectors.storedSecondaryIndexOfGroup("primary")).toBe(1);
    expect(store.selectors.storedSecondaryIndexOfGroup("danger")).toBe(0);
  });
});
