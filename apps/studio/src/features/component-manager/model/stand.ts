import { type Accessor, createMemo } from "solid-js";
import { useComponent } from "#/entities/component";
import {
  type Axes,
  assemblyIn,
  secondaryIndexIn,
  variantIn,
} from "../lib/axes";
import type { Cell } from "../lib/cell";
import { componentManagerStoreOf } from "./store";

/**
 * Единственное место, где состояние стенда (стор фичи) встречается с данными компонента
 * (сущность). Сведение живёт здесь, а не в каждом виде: иначе каждый, кому нужен «показанный в
 * ячейке вариант», собирал бы эту пару сам — и собирал бы по-разному.
 *
 * Стор берётся по имени из сущности: у каждого компонента своё состояние стенда, и переключение
 * на соседний компонент не должно тащить за собой чужие режимы. Имя внутри провайдера не меняется
 * (`keyed`), поэтому инстанс стора здесь стабилен.
 */
export function useStandStore() {
  return componentManagerStoreOf(useComponent().name);
}

export function useStand() {
  const component = useComponent();
  const store = componentManagerStoreOf(component.name);

  const axes: Accessor<Axes> = createMemo(() => ({
    variants: component.variants(),
    assemblies: component.editorInfo()?.assemblies ?? [],
  }));

  const axisMode = store.use((state) => state.axisMode);

  return {
    component,
    store,
    axes,

    /** Списки в порядке «сначала primary»: кто из них primary, знает только стенд. */
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

    variantOf: (cell: Cell) =>
      variantIn(
        axes(),
        axisMode(),
        cell,
        store.selectors.storedSecondaryIndex(cell),
      ),
    assemblyOf: (cell: Cell) =>
      assemblyIn(
        axes(),
        axisMode(),
        cell,
        store.selectors.storedSecondaryIndex(cell),
      ),
  };
}
