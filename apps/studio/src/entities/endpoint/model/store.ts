import { createActionStore } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";

/**
 * Проба ручки: чем она ответила, когда её дёрнули.
 *
 * Адрес ручки хранится разобранным на части, а не готовым путём: собирать путь участника —
 * работа `@web-core/feeder`, у него же живёт соглашение о виде участника. Здесь лежат только
 * составляющие, из которых путь собирают на месте вызова.
 */
export interface Probe {
  readonly presetId: string;
  readonly endpointId: string;
  /** Тело ответа как есть — образец, по которому строится правая колонка сведения полей. */
  readonly sample: unknown;
}

/**
 * Образец приходит из чужой фичи, которая может держать его у себя же. Состояние пишется через
 * immer, а тот морозит положенное глубоко — поэтому берём копию, тем же доводом, что и доска
 * кормления.
 */
function ownCopy(sample: unknown): unknown {
  return sample === undefined ? undefined : JSON.parse(JSON.stringify(sample));
}

interface EndpointState {
  readonly probe: Probe | undefined;
}

/**
 * Одна проба на приложение, последняя.
 *
 * Не семья по компоненту, в отличие от доски кормления: ручка живёт сама по себе и к компоненту
 * не привязана — связь между ними появляется только в адаптере, и заводит её человек.
 */
export const endpointStore = createActionStore<
  EndpointState,
  {
    probe(presetId: string, endpointId: string, sample: unknown): void;
  },
  {
    probe(state: EndpointState): Probe | undefined;
  }
>(
  { probe: undefined },
  ({ setState }) => ({
    probe(presetId, endpointId, sample) {
      setState(
        mutate<EndpointState>((draft) => {
          draft.probe = castDraft({
            presetId,
            endpointId,
            sample: ownCopy(sample),
          });
        }),
      );
    },
  }),
  () => ({
    probe(state) {
      return state.probe;
    },
  }),
);
