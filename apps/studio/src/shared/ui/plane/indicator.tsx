import { For } from "solid-js";
import { layoutGroup, type NativeStyle, spaceVar } from "@web-core/skin";
import { Flow } from "@web-core/ui";
import { type PlanePlacement, placementStyle } from "./lib/placement";

// Точка — собственная часть со своим видом, а не кнопка кита с погашенным оформлением: гасить
// чужое оформление пришлось бы больше, чем писать своё. Размер — ступень шкалы скина, цвет —
// токен палитры (`--accent-9`, та же запись, что в рецептах кита), поэтому обе темы приезжают
// со скином, а не своим подбором.
const DOT = {
  width: spaceVar("space-1"),
  height: spaceVar("space-1"),
  padding: "0",
  border: "none",
  "border-radius": "50%",
  background: "var(--accent-9)",
  cursor: "pointer",
} as const satisfies NativeStyle;

const DIM = "0.3";

/**
 * Индикатор одной оси: по точке на элемент, текущая — залитая, клик — переход.
 *
 * Второй способ показать положение на оси, рядом с полосами прокрутки браузера: полосы говорят
 * «сколько прокручено», точки — «который по счёту из скольких». Для плоскости, где шаг всегда
 * ровно в клетку, второе честнее. Выбирает тот, кто собирает: индикатор ставится сам по себе, а
 * полосы у плоскости выключаются пропом `scrollbar`.
 *
 * Заодно закрывает то, чего не умеет линейка со стрелками, — прыжок на произвольный элемент.
 */
export function PlaneIndicator(props: {
  orientation: "horizontal" | "vertical";
  items: readonly { readonly name: string }[];
  index: number;
  onSelect: (index: number) => void;
  /** Не задан — индикатор стоит в потоке. Задан — лежит поверх плоскости у своего края
   *  (только внутри `PlaneStack`). */
  placement?: PlanePlacement;
}) {
  return (
    <Flow
      style={{
        ...layoutGroup({
          direction: props.orientation === "vertical" ? "column" : "row",
          align: "center",
          justify: "center",
          gap: "space-2",
        }),
        ...placementStyle(props.placement),
      }}
    >
      <For each={props.items}>
        {(item, index) => (
          <button
            type="button"
            aria-label={item.name}
            aria-current={index() === props.index}
            onClick={() => props.onSelect(index())}
            style={{
              ...DOT,
              opacity: index() === props.index ? "1" : DIM,
            }}
          />
        )}
      </For>
    </Flow>
  );
}
