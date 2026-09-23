import { For, splitProps, type JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";
import { place, type DiagramBandScale, type DiagramContinuousScale } from "./axis.js";

export type DiagramBarOrientation = "vertical" | "horizontal";

export type DiagramBarProps<T> = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children" | "x" | "y"> & {
  data?: readonly T[];
  /** Категориальная шкала (полосы) — даёт положение и толщину каждого столбца. */
  categoryScale?: DiagramBandScale;
  /** Шкала значений — по ней считается длина столбца от базовой линии. */
  valueScale?: DiagramContinuousScale;
  /** Достаёт категорию (ключ полосы) из одной точки данных. */
  category: (datum: T) => string;
  /** Достаёт значение из одной точки данных. */
  value: (datum: T) => number;
  /** Вертикальные столбцы растут снизу вверх, горизонтальные — от базовой линии вбок. */
  orientation?: DiagramBarOrientation;
  /** Готовое CSS-значение на всю серию; не задано — красит рецепт (`FAQ.md`). */
  color?: string;
  /** Цвет ОТДЕЛЬНОГО столбца из данных — сильнее, чем `color`. */
  colorOf?: (datum: T) => string | undefined;
};

interface BarRect {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export function DiagramBar<T>(props: DiagramBarProps<T>) {
  traceLife("ui.diagram-bar");

  const [local, rest] = splitProps(props, [
    "data",
    "categoryScale",
    "valueScale",
    "category",
    "value",
    "orientation",
    "color",
    "colorOf",
  ]);

  const bars = (): readonly BarRect[] => {
    const data = local.data;
    const categoryScale = local.categoryScale;
    const valueScale = local.valueScale;
    const category = local.category;
    const value = local.value;

    if (!data || !categoryScale || !valueScale) return [];

    const horizontal = local.orientation === "horizontal";
    const baseline = valueScale.range()[0] ?? 0;
    const thickness = categoryScale.bandwidth();

    return data.flatMap((datum) => {
      const key = category(datum);
      const band = categoryScale(key);
      if (band === undefined) return [];

      const at = place(valueScale, value(datum));
      const near = Math.min(at, baseline);
      const span = Math.abs(baseline - at);
      const color = local.colorOf?.(datum);

      return [
        horizontal
          ? { key, x: near, y: band, width: span, height: thickness, color }
          : { key, x: band, y: near, width: thickness, height: span, color },
      ];
    });
  };

  return (
    <g
      style={local.color ? { color: local.color } : undefined}
      {...dropAddress(rest)}
      {...anatomyParts.bar.attrs}
    >
      <For each={bars()}>
        {(bar) => (
          <rect
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            style={bar.color ? { color: bar.color } : undefined}
            fill="currentColor"
          />
        )}
      </For>
    </g>
  );
}
