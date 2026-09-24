import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";
import { ownCopy } from "../lib";

/** Порция еды: данные и метка положившего. Метка — открытая строка, не перечисление. */
export interface Portion {
  readonly by: string;
  readonly data: unknown;
}

interface FeedState {
  readonly portion: Portion | undefined;
}

/** Доска кормления — одна на таргет, одна порция на доске. Разбор — FAQ.md. */
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
