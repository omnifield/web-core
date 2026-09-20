import { createActionStoreFamily } from "@web-core/store";
import { mutate } from "@web-core/store/mutate";

/**
 * Выбранная запись — состояние САМОГО поставщика, не доски кормления.
 *
 * На доске лежит еда; чем именно её выбрали — нужно только этой панели, чтобы показать
 * выбранное после возврата на компонент. Семья по имени компонента: список записей у каждого
 * свой, и выбор соседа здесь не значит ничего.
 */
interface PresetPickState {
  readonly name: string | undefined;
}

export const presetPickStoreOf = createActionStoreFamily<
  PresetPickState,
  {
    pick(name: string): void;
  },
  {
    name(state: PresetPickState): string | undefined;
  }
>(
  { name: undefined },
  ({ setState }) => ({
    pick(name) {
      setState(
        mutate<PresetPickState>((draft) => {
          draft.name = name;
        }),
      );
    },
  }),
  () => ({
    name(state) {
      return state.name;
    },
  }),
);
