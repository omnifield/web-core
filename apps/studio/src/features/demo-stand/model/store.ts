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
  state: Pick<DemoStandState, "axisMode">,
  group: string,
): CellKey {
  return `${state.axisMode}/group/${group}`;
}

function cellScopeKey(
  state: Pick<DemoStandState, "axisMode">,
  cell: Cell,
): CellKey {
  return `${state.axisMode}/cell/${cellKeyOf(cell)}`;
}

/** Какой scope слушает ЯЧЕЙКА при рендере — вот это действительно решает `layoutMode`, и решает
 *  здесь: в matrix слайд листает secondary всей обёртки, в grid — свой собственный. Записывающая
 *  сторона (контрол) ничего не угадывает — она с самого начала знает, кто она, и зовёт
 *  `setSecondaryIndexOfCell`/`setSecondaryIndexOfGroup` напрямую. */
function secondaryScopeOf(
  state: Pick<DemoStandState, "layoutMode" | "axisMode">,
  cell: Cell,
): CellKey {
  return state.layoutMode === "matrix"
    ? groupScopeKey(state, cell.group)
    : cellScopeKey(state, cell);
}

/**
 * Чем накормлена ячейка. Для пресета это ССЫЛКА — имя, а не тело.
 *
 * Тело пресета лежит в кэше запросов и принадлежит ему. Копия здесь не просто дублировала бы
 * его: стор пишется через immer, а immer глубоко морозит всё, что попало в состояние. Кэш
 * `solid-query` держит данные реактивным store-прокси, и заморозка такого объекта падает на
 * первой же ловушке (`Cannot define property Symbol(store-has)`) — а если бы прошла, замороженным
 * оказался бы сам кэш, и упал бы уже его рефетч. Разрешение «ссылка → данные» живёт в
 * `model/stand.ts`, там же, где стор встречается с сущностью.
 *
 * Ручные данные — другое дело: у них нет другого хозяина, стенд их и сочинил, поэтому они лежат
 * здесь целиком.
 */
export type Feed =
  | { readonly kind: "preset"; readonly name: string }
  | { readonly kind: "manual"; readonly data: unknown };

/**
 * Взять данные СЕБЕ.
 *
 * Ручные данные рождаются правкой пресета: форма отдаёт новую структуру, но её нетронутые ветки
 * — те же самые объекты кэша запросов. Положить их как есть нельзя (см. `Feed`): immer заморозит
 * чужое, и дальше ломается и чтение через реактивный прокси кэша, и сам кэш на рефетче. Это не
 * дубль пресета — правка от пресета уже отличается, и другого хозяина у неё нет.
 *
 * Через JSON, а не `structuredClone`: последний по спецификации отказывается клонировать Proxy,
 * а в кэше `solid-query` лежат именно они. Потери формата здесь нет — служба пресетов хранит
 * данные кормления тем же JSON, других значений в них и не бывает.
 */
function ownCopy(data: unknown): unknown {
  return data === undefined ? undefined : JSON.parse(JSON.stringify(data));
}

/**
 * Состояние ДЕМО-СТЕНДА — и только его: как разложить, по какой оси умножать, чем резать на
 * группы, каким видом показывать ячейку, чем она накормлена и какой secondary выбран.
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
interface DemoStandState {
  readonly layoutMode: LayoutMode;
  readonly axisMode: AxisMode;
  readonly filterMode: FilterMode;
  readonly viewMode: Readonly<Record<CellKey, ViewMode>>;
  readonly feed: Readonly<Record<CellKey, Feed>>;
  readonly secondaryIndex: Readonly<Record<CellKey, number>>;
}

export const demoStandStoreOf = createActionStoreFamily<
  DemoStandState,
  {
    setLayoutMode(layoutMode: LayoutMode): void;
    setAxisMode(axisMode: AxisMode): void;
    setFilterMode(filterMode: FilterMode): void;
    setViewMode(viewMode: ViewMode, cell?: Cell): void;
    setFeedPreset(name: string, cell?: Cell): void;
    setFeedData(data: unknown, cell?: Cell): void;
    setSecondaryIndexOfCell(index: number, cell: Cell): void;
    setSecondaryIndexOfGroup(index: number, group: string): void;
  },
  {
    viewMode(state: DemoStandState, cell: Cell): ViewMode;
    feed(state: DemoStandState, cell: Cell): Feed | undefined;
    /** Корм всего стенда — то, чем кормят панели `ui/feed`. Отдельный селектор, а не `feed` с
     *  необязательной ячейкой: параметризованный селектор узнают по arity сигнатуры, а
     *  необязательный аргумент в неё не считается. */
    standFeed(state: DemoStandState): Feed | undefined;
    /** Хранимый выбор, БЕЗ приведения к границам списка: списков стор не знает. К границам его
     *  приводит `secondaryIndexIn` (`lib/axes.ts`) — там, где списки есть. */
    storedSecondaryIndex(state: DemoStandState, cell: Cell): number;
    storedSecondaryIndexOfGroup(
      state: DemoStandState,
      group: string,
    ): number;
  }
>(
  {
    layoutMode: DEFAULT_LAYOUT_MODE,
    axisMode: DEFAULT_AXIS_MODE,
    filterMode: DEFAULT_FILTER_MODE,
    viewMode: { [ALL_CELLS]: "form" },
    feed: {},
    secondaryIndex: {},
  },
  ({ setState }) => {
    /** Запись корма — одна на оба источника: разница только в том, что записывают. Пресет и
     *  ручные данные должны вытеснять друг друга, а не лежать в разных полях: накормлено
     *  чем-то ОДНИМ. */
    function setFeed(feed: Feed, cell?: Cell) {
      const key = cell === undefined ? ALL_CELLS : cellKeyOf(cell);
      setState(
        mutate<DemoStandState>((draft) => {
          if (key === ALL_CELLS) {
            draft.feed = { [ALL_CELLS]: castDraft(feed) };
          } else {
            draft.feed[key] = castDraft(feed);
          }
        }),
      );
    }

    return {
      setLayoutMode(layoutMode) {
        setState(
          mutate<DemoStandState>((draft) => {
            draft.layoutMode = layoutMode;
          }),
        );
      },
      setAxisMode(axisMode) {
        setState(
          mutate<DemoStandState>((draft) => {
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
          mutate<DemoStandState>((draft) => {
            draft.filterMode = filterMode;
          }),
        );
      },
      setViewMode(viewMode, cell) {
        const key = cell === undefined ? ALL_CELLS : cellKeyOf(cell);
        setState(
          mutate<DemoStandState>((draft) => {
            if (key === ALL_CELLS) {
              draft.viewMode = { [ALL_CELLS]: viewMode };
            } else {
              draft.viewMode[key] = viewMode;
            }
          }),
        );
      },
      setFeedPreset(name, cell) {
        setFeed({ kind: "preset", name }, cell);
      },
      setFeedData(data, cell) {
        setFeed({ kind: "manual", data: ownCopy(data) }, cell);
      },
      setSecondaryIndexOfCell(index, cell) {
        setState(
          mutate<DemoStandState>((draft) => {
            draft.secondaryIndex[cellScopeKey(draft, cell)] = index;
          }),
        );
      },
      setSecondaryIndexOfGroup(index, group) {
        setState(
          mutate<DemoStandState>((draft) => {
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
    feed(state, cell) {
      return state.feed[cellKeyOf(cell)] ?? state.feed[ALL_CELLS];
    },
    standFeed(state) {
      return state.feed[ALL_CELLS];
    },
    storedSecondaryIndex(state, cell) {
      return state.secondaryIndex[secondaryScopeOf(state, cell)] ?? 0;
    },
    storedSecondaryIndexOfGroup(state, group) {
      return state.secondaryIndex[groupScopeKey(state, group)] ?? 0;
    },
  }),
);
