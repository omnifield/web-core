import { createEffect, For, type JSX, onCleanup, Show } from "solid-js";
import type { NativeStyle } from "@web-core/skin";
import {
  type PlanePosition,
  snapIndexAt,
  withinWindow,
} from "../../../../lib/plane";

/** Сколько ждать тишины, чтобы считать скролл доехавшим.
 *
 *  Позиция докладывается только по остановке, а не на каждом событии скролла. Иначе плавный
 *  доезд по клику линейки проходит через промежуточные округления, каждое из них уезжает в
 *  состояние, состояние возвращается сюда новым `position` — и плоскость начинает спорить сама
 *  с собой. `scrollend` решил бы это красивее, но он ещё не везде, а таймер работает всюду. */
const SETTLE_MS = 120;

const VIEWPORT = {
  overflow: "auto",
  // Обе оси разом. Развести жест по осям не нужно — браузер сам защёлкивает почти-вертикальный
  // и почти-горизонтальный свайп на одну ось (axis locking), поэтому один свайп = один шаг.
  // Ровно это и не получалось у вложенных каруселей: там оси делили два разных скроллера.
  "scroll-snap-type": "both mandatory",
  // Доехали до края — на этом всё. Без `contain` остаток жеста уходит в страницу, и витрина
  // уезжает целиком.
  "overscroll-behavior": "contain",
} as const satisfies NativeStyle;

const TRACK = {
  display: "grid",
  width: "100%",
  height: "100%",
} as const satisfies NativeStyle;

// Рамка ровно во вьюпорт. Содержимое, которое не влезло, обрезается, а не скроллится: свой
// скролл внутри рамки — это вложенный скроллер поперёк плоскости, то есть ровно та мешанина
// жестов, от которой мы ушли. Не влезает — вопрос к `footprint` компонента, не к рамке.
const FRAME = {
  "scroll-snap-align": "start",
  overflow: "hidden",
  // Компонент стоит по центру рамки СВОИМ размером. Рамка здесь во всю ширину вьюпорта, и
  // растяжка (`stretch` по умолчанию у грида) размазывала бы кнопку на всю плоскость — показ
  // врал бы о том, как компонент выглядит. Центр, а не верхний угол: в матрице соседние клетки
  // сравнивают глазом, и компонент должен оставаться на одном месте при свайпе.
  display: "grid",
  "place-content": "center",
} as const satisfies NativeStyle;

/**
 * Двумерная плоскость привязки: N столбцов × M строк рамок размером во вьюпорт, свайп по обеим
 * осям, живой рендер — только в окне вокруг текущей позиции.
 *
 * Плоскость ничего не знает ни про варианты, ни про сборки, ни про стор: ей дают два списка и
 * текущую позицию, она отдаёт новую, когда пользователь досвайпал. Что рисовать в клетке —
 * дело вызывающего.
 */
export function Plane<Column, Row>(props: {
  columns: readonly Column[];
  rows: readonly Row[];
  position: PlanePosition;
  onMove: (position: PlanePosition) => void;
  children: (cell: {
    column: Column;
    row: Row;
    position: PlanePosition;
  }) => JSX.Element;
  style?: NativeStyle;
}) {
  let viewport!: HTMLDivElement;
  let settle: ReturnType<typeof setTimeout> | undefined;

  function report() {
    const column = snapIndexAt(
      viewport.scrollLeft,
      viewport.clientWidth,
      props.columns.length,
    );
    const row = snapIndexAt(
      viewport.scrollTop,
      viewport.clientHeight,
      props.rows.length,
    );
    if (column === props.position.column && row === props.position.row) return;
    props.onMove({ column, row });
  }

  function onScroll() {
    if (settle !== undefined) clearTimeout(settle);
    settle = setTimeout(report, SETTLE_MS);
  }

  onCleanup(() => {
    if (settle !== undefined) clearTimeout(settle);
  });

  // Позицию сменили снаружи — линейкой или другим контролом. Доезжаем сами; если уже стоим
  // где надо (позиция приехала от собственного `report`), не трогаем ничего.
  createEffect(() => {
    const left = props.position.column * viewport.clientWidth;
    const top = props.position.row * viewport.clientHeight;
    if (
      Math.abs(viewport.scrollLeft - left) < 1 &&
      Math.abs(viewport.scrollTop - top) < 1
    ) {
      return;
    }
    viewport.scrollTo({ left, top, behavior: "smooth" });
  });

  const live = (column: number, row: number) =>
    withinWindow(column, props.position.column) &&
    withinWindow(row, props.position.row);

  return (
    <div
      ref={viewport}
      onScroll={onScroll}
      style={{ ...VIEWPORT, ...props.style }}
    >
      <div
        style={{
          ...TRACK,
          "grid-template-columns": `repeat(${props.columns.length}, 100%)`,
          "grid-template-rows": `repeat(${props.rows.length}, 100%)`,
        }}
      >
        <For each={props.rows}>
          {(row, rowIndex) => (
            <For each={props.columns}>
              {(column, columnIndex) => (
                <div style={FRAME}>
                  <Show when={live(columnIndex(), rowIndex())}>
                    {props.children({
                      column,
                      row,
                      position: { column: columnIndex(), row: rowIndex() },
                    })}
                  </Show>
                </div>
              )}
            </For>
          )}
        </For>
      </div>
    </div>
  );
}
