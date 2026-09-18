import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";
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
  state: Pick<ComponentManagerState, "axisMode">,
  group: string,
): CellKey {
  return `${state.axisMode}/group/${group}`;
}

function cellScopeKey(
  state: Pick<ComponentManagerState, "axisMode">,
  cell: Cell,
): CellKey {
  return `${state.axisMode}/cell/${cellKeyOf(cell)}`;
}

/** Какой scope слушает ЯЧЕЙКА при рендере — вот это действительно решает `layoutMode`, и решает
 *  здесь: в matrix слайд листает secondary всей обёртки, в grid — свой собственный. Записывающая
 *  сторона (контрол) ничего не угадывает — она с самого начала знает, кто она, и зовёт
 *  `setSecondaryIndexOfCell`/`setSecondaryIndexOfGroup` напрямую. */
function secondaryScopeOf(
  state: Pick<ComponentManagerState, "layoutMode" | "axisMode">,
  cell: Cell,
): CellKey {
  return state.layoutMode === "matrix"
    ? groupScopeKey(state, cell.group)
    : cellScopeKey(state, cell);
}

/**
 * Состояние ДЕМО-СТЕНДА — и только его: как разложить, по какой оси умножать, чем резать на
 * группы, каким видом показывать ячейку, что ей скормлено и какой secondary выбран.
 *
 * Данных самого компонента (срез редактора, io-схема, варианты, пресеты) здесь нет намеренно.
 * Это ответ на вопрос «что это за компонент», он от смотрящего не зависит и живёт в
 * `entities/component` (`ComponentProvider`/`useComponent`), где его ведёт кэш запросов. Копия
 * в этом сторе была третьей по счёту — и единственной, которая не умела ни показать загрузку,
 * ни рассказать об ошибке, ни обновиться.
 *
 * Поэтому здесь же больше нет и разрешения «ячейка → показанный элемент»: для него нужны оба
 * списка, а стор их не держит. Разрешение — чистые функции в `lib/axes.ts`, сведённые с этим
 * состоянием в `model/stand.ts`.
 */
interface ComponentManagerState {
  readonly layoutMode: LayoutMode;
  readonly axisMode: AxisMode;
  readonly filterMode: FilterMode;
  readonly viewMode: Readonly<Record<CellKey, ViewMode>>;
  readonly feedData: Readonly<Record<CellKey, unknown>>;
  readonly secondaryIndex: Readonly<Record<CellKey, number>>;
}

export const componentManagerStoreOf = createActionStoreFamily<
  ComponentManagerState,
  {
    setLayoutMode(layoutMode: LayoutMode): void;
    setAxisMode(axisMode: AxisMode): void;
    setFilterMode(filterMode: FilterMode): void;
    setViewMode(viewMode: ViewMode, cell?: Cell): void;
    setFeedData(feedData: unknown, cell?: Cell): void;
    setSecondaryIndexOfCell(index: number, cell: Cell): void;
    setSecondaryIndexOfGroup(index: number, group: string): void;
  },
  {
    viewMode(state: ComponentManagerState, cell: Cell): ViewMode;
    feedData(state: ComponentManagerState, cell: Cell): unknown;
    /** Хранимый выбор, БЕЗ приведения к границам списка: списков стор не знает. К границам его
     *  приводит `secondaryIndexIn` (`lib/axes.ts`) — там, где списки есть. */
    storedSecondaryIndex(state: ComponentManagerState, cell: Cell): number;
    storedSecondaryIndexOfGroup(
      state: ComponentManagerState,
      group: string,
    ): number;
  }
>(
  {
    layoutMode: DEFAULT_LAYOUT_MODE,
    axisMode: DEFAULT_AXIS_MODE,
    filterMode: DEFAULT_FILTER_MODE,
    viewMode: { [ALL_CELLS]: "form" },
    feedData: {},
    secondaryIndex: {},
  },
  ({ setState }) => ({
    setLayoutMode(layoutMode) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          draft.layoutMode = layoutMode;
        }),
      );
    },
    setAxisMode(axisMode) {
      setState(
        mutate<ComponentManagerState>((draft) => {
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
        mutate<ComponentManagerState>((draft) => {
          draft.filterMode = filterMode;
        }),
      );
    },
    setViewMode(viewMode, cell) {
      const key = cell === undefined ? ALL_CELLS : cellKeyOf(cell);
      setState(
        mutate<ComponentManagerState>((draft) => {
          if (key === ALL_CELLS) {
            draft.viewMode = { [ALL_CELLS]: viewMode };
          } else {
            draft.viewMode[key] = viewMode;
          }
        }),
      );
    },
    setFeedData(feedData, cell) {
      const key = cell === undefined ? ALL_CELLS : cellKeyOf(cell);
      setState(
        mutate<ComponentManagerState>((draft) => {
          if (key === ALL_CELLS) {
            draft.feedData = { [ALL_CELLS]: castDraft(feedData) };
          } else {
            draft.feedData[key] = castDraft(feedData);
          }
        }),
      );
    },
    setSecondaryIndexOfCell(index, cell) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          draft.secondaryIndex[cellScopeKey(draft, cell)] = index;
        }),
      );
    },
    setSecondaryIndexOfGroup(index, group) {
      setState(
        mutate<ComponentManagerState>((draft) => {
          draft.secondaryIndex[groupScopeKey(draft, group)] = index;
        }),
      );
    },
  }),
  () => ({
    viewMode(state, cell) {
      return (
        state.viewMode[cellKeyOf(cell)] ?? state.viewMode[ALL_CELLS] ?? "form"
      );
    },
    feedData(state, cell) {
      return state.feedData[cellKeyOf(cell)] ?? state.feedData[ALL_CELLS];
    },
    storedSecondaryIndex(state, cell) {
      return state.secondaryIndex[secondaryScopeOf(state, cell)] ?? 0;
    },
    storedSecondaryIndexOfGroup(state, group) {
      return state.secondaryIndex[groupScopeKey(state, group)] ?? 0;
    },
  }),
);
