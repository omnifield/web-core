import { run } from "@web-core/generators/mapping";
import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";

import { descriptorToEndpoint } from "./descriptor.js";
import { endpointKey } from "./key.js";
import { swagger2Template } from "./swagger/2.0/index.js";
import type { EndpointDescriptor, OpenapiEndpoint } from "./types.js";

export type ApiStatus = "idle" | "loading" | "ready" | "failed";

export interface ApiCatalogState {
  /** Исходный документ схемы, как его дал юзер — держим, чтобы отличить «ещё не грузили» от
   *  «загрузили и не распозналось», и чтобы отсечь ответ устаревшей загрузки (см. `loadSchema`). */
  readonly raw?: string;
  readonly endpoints: readonly OpenapiEndpoint[];
  readonly status: ApiStatus;
  readonly error?: string;
}

/**
 * Каталог ручек ОДНОГО бэка — структурная модель («что за набор ручек и откуда он взялся»), а не
 * действие интерфейса: живёт в `entities` и поэтому одинаково доступен и экрану настройки, и
 * сборке, которая кормит компонент на витрине.
 *
 * Семья, а не общий стор: бэков у юзера сколько угодно, они живы ОДНОВРЕМЕННО (на экране
 * настроек виден список всех) и не должны видеть ручки друг друга. Перечень самих бэков — это
 * `groupsStore` рядом; здесь — состав каждого.
 */
export const apiCatalogOf = createActionStoreFamily<
  ApiCatalogState,
  {
    loadSchema(raw: string): Promise<void>;
    addEndpoint(descriptor: EndpointDescriptor): void;
    removeEndpoint(id: string): void;
  },
  // Ключ семьи — айди API.
  string
>(
  { endpoints: [], status: "idle" },
  ({ setState, get }) => ({
    async loadSchema(raw) {
      setState(
        mutate<ApiCatalogState>((draft) => {
          draft.raw = raw;
          draft.status = "loading";
          draft.error = undefined;
        }),
      );

      try {
        const endpoints = await run(raw, [swagger2Template]);
        // Пока шло распознавание, юзер мог залить другой документ — тогда этот ответ уже не про
        // текущее состояние стора и должен быть выброшен, а не записан поверх свежего.
        if (get().raw !== raw) return;

        setState(
          mutate<ApiCatalogState>((draft) => {
            draft.endpoints = castDraft(endpoints);
            draft.status = "ready";
          }),
        );
      } catch (error) {
        if (get().raw !== raw) return;

        setState(
          mutate<ApiCatalogState>((draft) => {
            draft.endpoints = [];
            draft.status = "failed";
            draft.error = error instanceof Error ? error.message : String(error);
          }),
        );
      }
    },
    addEndpoint(descriptor) {
      const endpoint = descriptorToEndpoint(descriptor);
      setState(
        mutate<ApiCatalogState>((draft) => {
          const id = endpointKey(endpoint);
          const at = draft.endpoints.findIndex((item) => endpointKey(item) === id);
          if (at === -1) draft.endpoints.push(castDraft(endpoint));
          else draft.endpoints[at] = castDraft(endpoint);
          draft.status = "ready";
        }),
      );
    },
    removeEndpoint(id) {
      setState(
        mutate<ApiCatalogState>((draft) => {
          draft.endpoints = draft.endpoints.filter((item) => endpointKey(item) !== id);
        }),
      );
    },
  }),
);

/** Ручка по айди — обычная функция над состоянием, а не селектор стора: параметризованные
 *  селекторы `createActionStore` (те, что с аргументом после `state`) не проходят типизацию
 *  своего же пакета. Завести обратно в стор, когда это починят. */
export function endpointBy(state: ApiCatalogState, id: string): OpenapiEndpoint | undefined {
  return state.endpoints.find((endpoint) => endpointKey(endpoint) === id);
}
