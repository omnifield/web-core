import { createActionStoreFamily } from "@web-core/store";
import { mutate } from "@web-core/store/mutate";

export type SettingValue = string | boolean;

/**
 * Что человек ВЫБРАЛ сам — и только это. Умолчание лежит в паспорте компонента и копии здесь не
 * имеет: копия умолчания разъезжается с паспортом молча, а отличить «оставлено как есть» от
 * «выбрано то же самое» по ней уже нельзя.
 */
interface SettingsState {
  readonly chosen: Readonly<Record<string, SettingValue>>;
}

/**
 * Доска настроек — одна на компонент: у каждого свой набор имён, и уход на соседа не должен
 * подставлять ему чужой выбор.
 *
 * Значения живут ровно столько, сколько открыта вкладка (решение user): настройка показа — это
 * «покажи мне вот так сейчас», а не свойство компонента, которое кто-то ждёт завтра.
 */
export const settingsStoreOf = createActionStoreFamily<
  SettingsState,
  {
    choose(name: string, value: SettingValue): void;
  },
  {
    chosen(state: SettingsState): Readonly<Record<string, SettingValue>>;
  }
>(
  { chosen: {} },
  ({ setState }) => ({
    choose(name, value) {
      setState(
        mutate<SettingsState>((draft) => {
          draft.chosen[name] = value;
        }),
      );
    },
  }),
  () => ({
    chosen(state) {
      return state.chosen;
    },
  }),
);
