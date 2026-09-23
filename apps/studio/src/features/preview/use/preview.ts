import { type Accessor, createMemo } from "@web-core/solid";
import { useInfo } from "#/entities/component";
import {
  type Axes,
  assemblyIn,
  secondaryIndexIn,
  variantIn,
} from "../lib/axes";
import type { Cell } from "../lib/cell";
import { previewStoreOf } from "../model";

/**
 * Единственное место, где состояние показа (стор фичи) встречается с данными компонента
 * (сущность). Сведение живёт здесь, а не в каждом виде: иначе каждый, кому нужен «показанный в
 * ячейке вариант», собирал бы эту пару сам — и собирал бы по-разному.
 *
 * Стор берётся по имени из сущности: у каждого компонента своё состояние показа, и переключение
 * на соседний компонент не должно тащить за собой чужие режимы. Семья зовётся аксессором имени —
 * подписка сама переезжает на стор нового ключа, состояние прежнего остаётся в семье.
 */
export function usePreview() {
  const component = useInfo();
  const store = previewStoreOf(component.name);

  const axes: Accessor<Axes> = createMemo(() => ({
    variants: component.variants.data(),
    assemblies: component.editorInfo()?.assemblies ?? [],
  }));

  const axisMode = store.use((state) => state.axisMode);

  return {
    component,
    store,
    axes,

    /** Списки в порядке «сначала primary»: кто из них primary, знает только показ. */
    primaryItems: () =>
      axisMode() === "variant" ? axes().variants : axes().assemblies,
    secondaryItems: () =>
      axisMode() === "variant" ? axes().assemblies : axes().variants,

    /** Выбор secondary, приведённый к границам списка, — то, что можно показывать и чем можно
     *  индексировать. Сырое число из стора наружу не ходит. */
    secondaryIndexOf: (cell: Cell) =>
      secondaryIndexIn(
        axes(),
        axisMode(),
        store.selectors.storedSecondaryIndex(cell),
      ),
    secondaryIndexOfGroup: (group: string) =>
      secondaryIndexIn(
        axes(),
        axisMode(),
        store.selectors.storedSecondaryIndexOfGroup(group),
      ),

    // `secondary` можно назвать явно: плоскость матрицы рисует окно вокруг текущей позиции, и
    // соседние строки окна — это по определению НЕ текущий выбор. Без явного аргумента они
    // показывали бы одно и то же, и вертикальный свайп открывал бы копию вместо соседа.
    variantOf: (cell: Cell, secondary?: number) =>
      variantIn(
        axes(),
        axisMode(),
        cell,
        secondary ?? store.selectors.storedSecondaryIndex(cell),
      ),
    assemblyOf: (cell: Cell, secondary?: number) =>
      assemblyIn(
        axes(),
        axisMode(),
        cell,
        secondary ?? store.selectors.storedSecondaryIndex(cell),
      ),
  };
}
