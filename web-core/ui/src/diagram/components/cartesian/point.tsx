import { For, splitProps, type JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";
import { place, placeOn, type DiagramContinuousScale, type DiagramScale } from "./axis.js";

export type DiagramPointProps<T> = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children" | "x" | "y"> & {
  data?: readonly T[];
  /** Любая шкала: у полосовой точка встаёт в центр своей полосы. */
  xScale?: DiagramScale;
  yScale?: DiagramContinuousScale;
  /** Достаёт значение по оси x из одной точки данных — само значение, не уже пересчитанный пиксель. */
  x: (datum: T) => number | string | Date;
  /** То же самое для оси y. */
  y: (datum: T) => number;
  /** Радиус каждой точки в пикселях. */
  radius?: number;
  /** Готовое CSS-значение на всю серию; не задано — красит рецепт (`FAQ.md`). */
  color?: string;
  /** Цвет ОТДЕЛЬНОЙ точки из данных — сильнее, чем `color`. */
  colorOf?: (datum: T) => string | undefined;
};

interface Point {
  cx: number;
  cy: number;
  color?: string;
}

export function DiagramPoint<T>(props: DiagramPointProps<T>) {
  traceLife("ui.diagram-point");

  const [local, rest] = splitProps(props, [
    "data",
    "xScale",
    "yScale",
    "x",
    "y",
    "radius",
    "color",
    "colorOf",
  ]);

  const points = (): readonly Point[] => {
    const data = local.data;
    const xScale = local.xScale;
    const yScale = local.yScale;
    const x = local.x;
    const y = local.y;

    if (!data || !xScale || !yScale) return [];

    return data.flatMap((datum) => {
      const cx = placeOn(xScale, x(datum));
      if (cx === undefined) return [];

      return [{ cx, cy: place(yScale, y(datum)), color: local.colorOf?.(datum) }];
    });
  };

  return (
    <g
      style={local.color ? { color: local.color } : undefined}
      {...dropAddress(rest)}
      {...anatomyParts.point.attrs}
    >
      <For each={points()}>
        {(point) => (
          <circle
            cx={point.cx}
            cy={point.cy}
            r={local.radius ?? 3}
            style={point.color ? { color: point.color } : undefined}
            fill="currentColor"
          />
        )}
      </For>
    </g>
  );
}
