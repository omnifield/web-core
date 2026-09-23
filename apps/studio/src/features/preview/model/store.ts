import { createActionStoreFamily } from "@web-core/store";
import { mutate } from "@web-core/store/mutate";
import type { Cell } from "../lib/cell";
import {
  type AxisMode,
  DEFAULT_AXIS_MODE,
  DEFAULT_FILTER_MODE,
  DEFAULT_LAYOUT_MODE,
  type FilterMode,
  filterAppliesTo,
  type LayoutMode,
  type ViewMode,
} from "./modes";

export type CellKey = string;
export const ALL_CELLS: CellKey = "*";

/** Адрес ячейки — её собственная пара «группа + позиция», а не отдельно хранимое поле: позиция
 *  уникальна только ВНУТРИ группы, и один вариант с двумя тегами живёт в двух группах сразу.
 *  Ключ без группы делал такие ячейки одной: переключение в одной секции меняло другую. */
function cellKeyOf(cell: Cell): CellKey {
  return `${cell.group}/${cell.primary}`;
}

/** Два адресуемых scope, каждый со своим ключом. Ключ обязан описывать, ЧЕМ является хранимое
 *  число, а не только где его выбрали: при смене `axisMode` тот же индекс указывает уже в другой
 *  список, а группа и ячейка — разные пространства имён (тег вполне может называться "0", ровно
 *  как позиция первой ячейки). Обе координаты сидят в ключе, поэтому переключение туда-обратно
 *  возвращает прежний выбор, а не чужой. */
function groupScopeKey(
  state: Pick<PreviewState, "axisMode">,
  group: string,
): CellKey {
  return `${state.axisMode}/group/${group}`;
}

function cellScopeKey(
  state: Pick<PreviewState, "axisMode">,
  cell: Cell,
): CellKey {
  return `${state.axisMode}/cell/${cellKeyOf(cell)}`;
}

/** Какой scope слушает ЯЧЕЙКА при рендере — вот это действительно решает `layoutMode`, и решает
 *  здесь: в matrix слайд листает secondary всей обёртки, в grid — свой собственный. Записывающая
 *  сторона (контрол) ничего не угадывает — она с самого начала знает, кто она, и зовёт
 *  `setSecondaryIndexOfCell`/`setSecondaryIndexOfGroup` напрямую. */
function secondaryScopeOf(
  state: Pick<PreviewState, "layoutMode" | "axisMode">,
  cell: Cell,
): CellKey {
  return state.layoutMode === "matrix"
    ? groupScopeKey(state, cell.group)
    : cellScopeKey(state, cell);
}

/**
 * Состояние ПОКАЗА — и только его: как разложить, по какой оси умножать, чем резать на группы,
 * каким видом показывать ячейку и какой secondary выбран.
 *
 * Чем компонент накормлен, здесь больше нет: еда — не свойство показа, её кладут поставщики и
 * читают все желающие через `entities/feed`.
 *
 * Данных самого компонента (срез редактора, io-схема, варианты, пресеты) здесь нет намеренно.
 * Это ответ на вопрос «что это за компонент», он от смотрящего не зависит и живёт в
 * `entities/component` (`useInfo`), где его ведёт кэш запросов. Копия
 * в этом сторе была третьей по счёту — и единственной, которая не умела ни показать загрузку,
 * ни рассказать об ошибке, ни обновиться.
 *
 * Поэтому здесь же больше нет и разрешения «ячейка → показанный элемент»: для него нужны оба
 * списка, а стор их не держит. Разрешение — чистые функции в `lib/axes.ts`, сведённые с этим
 * состоянием в `model/preview.ts`.
 */
interface PreviewState {
  readonly layoutMode: LayoutMode;
  readonly axisMode: AxisMode;
  readonly filterMode: FilterMode;
  readonly viewMode: Readonly<Record<CellKey, ViewMode>>;
  readonly secondaryIndex: Readonly<Record<CellKey, number>>;
}

export const previewStoreOf = createActionStoreFamily<
  PreviewState,
  {
    setLayoutMode(layoutMode: LayoutMode): void;
    setAxisMode(axisMode: AxisMode): void;
    setFilterMode(filterMode: FilterMode): void;
    setViewMode(viewMode: ViewMode, cell?: Cell): void;
    setSecondaryIndexOfCell(index: number, cell: Cell): void;
    setSecondaryIndexOfGroup(index: number, group: string): void;
  },
  {
    viewMode(state: PreviewState, cell: Cell): ViewMode;
    /** Хранимый выбор, БЕЗ приведения к границам списка: списков стор не знает. К границам его
     *  приводит `secondaryIndexIn` (`lib/axes.ts`) — там, где списки есть. */
    storedSecondaryIndex(state: PreviewState, cell: Cell): number;
    storedSecondaryIndexOfGroup(
      state: PreviewState,
      group: string,
    ): number;
  }
>(
  {
    layoutMode: DEFAULT_LAYOUT_MODE,
    axisMode: DEFAULT_AXIS_MODE,
    filterMode: DEFAULT_FILTER_MODE,
    viewMode: { [ALL_CELLS]: "form" },
    secondaryIndex: {},
  },
  ({ setState }) => {
    return {
      setLayoutMode(layoutMode) {
        setState(
          mutate<PreviewState>((draft) => {
            draft.layoutMode = layoutMode;
          }),
        );
      },
      setAxisMode(axisMode) {
        setState(
          mutate<PreviewState>((draft) => {
            draft.axisMode = axisMode;

            // Применимость фильтра зависит от оси (теги есть только у вариантов), поэтому смена оси
            // может оставить в состоянии режим, которого на новой оси нет. Оставить его — значит
            // развести состояние с тем, что видно: контрол такой режим уже не предложит, а
            // раскладка продолжит по нему резать. Сбрасываем на дефолт, применимый к любой оси.
            if (!filterAppliesTo(draft.filterMode, axisMode)) {
              draft.filterMode = DEFAULT_FILTER_MODE;
            }
          }),
        );
      },
      setFilterMode(filterMode) {
        setState(
          mutate<PreviewState>((draft) => {
            draft.filterMode = filterMode;
          }),
        );
      },
      setViewMode(viewMode, cell) {
        const key = cell === undefined ? ALL_CELLS : cellKeyOf(cell);
        setState(
          mutate<PreviewState>((draft) => {
            if (key === ALL_CELLS) {
              draft.viewMode = { [ALL_CELLS]: viewMode };
            } else {
              draft.viewMode[key] = viewMode;
            }
          }),
        );
      },
      setSecondaryIndexOfCell(index, cell) {
        setState(
          mutate<PreviewState>((draft) => {
            draft.secondaryIndex[cellScopeKey(draft, cell)] = index;
          }),
        );
      },
      setSecondaryIndexOfGroup(index, group) {
        setState(
          mutate<PreviewState>((draft) => {
            draft.secondaryIndex[groupScopeKey(draft, group)] = index;
          }),
        );
      },
    };
  },
  () => ({
    viewMode(state, cell) {
      return (
        state.viewMode[cellKeyOf(cell)] ?? state.viewMode[ALL_CELLS] ?? "form"
      );
    },
    storedSecondaryIndex(state, cell) {
      return state.secondaryIndex[secondaryScopeOf(state, cell)] ?? 0;
    },
    storedSecondaryIndexOfGroup(state, group) {
      return state.secondaryIndex[groupScopeKey(state, group)] ?? 0;
    },
  }),
);
