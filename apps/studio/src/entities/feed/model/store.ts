import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";

/**
 * Порция еды: сами данные и метка того, кто их положил.
 *
 * Метка — открытая строка, не перечисление: сущность не знает списка поставщиков и не должна
 * меняться от появления нового. Читающему она говорит, чем компонент накормлен сейчас; по ней же
 * интерфейс решает, чья панель настройки открыта.
 *
 * Как поставщик выбрал эти данные — имя пресета, черновик формы, адрес ручки — здесь не лежит:
 * это нужно только ему самому, и живёт в его собственном сторе.
 */
export interface Portion {
  readonly by: string;
  readonly data: unknown;
}

/**
 * Взять еду себе.
 *
 * Еда приезжает из ЧУЖОГО стора — кэша запросов, стора поставщика, — где вполне может лежать
 * реактивный прокси. Состояние здесь пишется через immer, а тот морозит положенное глубоко:
 * заморозка прокси падает на первой же ловушке, а прошла бы — замороженным оказался бы чужой
 * кэш. Клонирование стоит здесь, а не у каждого поставщика: иначе первый, кто про него забудет,
 * роняет не себя, а того, у кого взял.
 *
 * Через JSON, а не `structuredClone`: последний по спецификации отказывается клонировать Proxy.
 * Потери формата нет — еда компонента это данные, других значений в ней не бывает.
 */
function ownCopy(data: unknown): unknown {
  return data === undefined ? undefined : JSON.parse(JSON.stringify(data));
}

interface FeedState {
  readonly portion: Portion | undefined;
}

/**
 * Доска кормления — одна на компонент, одна порция на доске.
 *
 * Семья по имени компонента: у каждого своя еда, и уход на соседний компонент не подменяет её
 * чужой. Ячейки, оси и группы здесь не адресуются намеренно — это понятия показа, а не еды;
 * кормится компонент целиком.
 */
export const feedStoreOf = createActionStoreFamily<
  FeedState,
  {
    serve(by: string, data: unknown): void;
  },
  {
    portion(state: FeedState): Portion | undefined;
  }
>(
  { portion: undefined },
  ({ setState }) => ({
    serve(by, data) {
      setState(
        mutate<FeedState>((draft) => {
          draft.portion = castDraft({ by, data: ownCopy(data) });
        }),
      );
    },
  }),
  () => ({
    portion(state) {
      return state.portion;
    },
  }),
);
