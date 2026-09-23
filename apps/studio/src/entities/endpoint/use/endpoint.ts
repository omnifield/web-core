import { endpointStore } from "../model";

/**
 * Какую ручку дёрнули последней и чем она ответила.
 *
 * Тот же приём, что у доски кормления: каталог ручек стоит в правом рейле, экран сведения полей
 * — в главной области, это разные ветки дерева. Друг друга они не видят и встречаются здесь.
 */
export function useEndpoint() {
  return {
    probe: () => endpointStore.selectors.probe(),
    remember: (presetId: string, endpointId: string, sample: unknown) =>
      endpointStore.actions.probe(presetId, endpointId, sample),
  };
}
