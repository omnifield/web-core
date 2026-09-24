import { line as shapeLine } from "d3-shape";
import { splitProps, type JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";
import { place, placeOn, type DiagramContinuousScale, type DiagramScale } from "./axis.js";

export type DiagramLineProps<T> = Omit<JSX.SvgSVGAttributes<SVGPathElement>, "children" | "d" | "x" | "y"> & {
  data?: readonly T[];
  /** Любая шкала: у полосовой точка встаёт в центр своей полосы. */
  xScale?: DiagramScale;
  yScale?: DiagramContinuousScale;
  /** Достаёт значение по оси x из одной точки данных — само значение, не уже пересчитанный пиксель. */
  x: (datum: T) => number | string | Date;
  /** То же самое для оси y. */
  y: (datum: T) => number;
  /** Готовое CSS-значение из данных; не задано — красит рецепт (`FAQ.md`). */
  color?: string;
};

export function DiagramLine<T>(props: DiagramLineProps<T>) {
  traceLife("ui.diagram-line");

  const [local, rest] = splitProps(props, ["data", "xScale", "yScale", "x", "y", "color"]);

  const d = (): string | undefined => {
    const data = local.data;
    const xScale = local.xScale;
    const yScale = local.yScale;
    const x = local.x;
    const y = local.y;

    if (!data || !xScale || !yScale) return undefined;

    const drawable = data.filter((datum) => placeOn(xScale, x(datum)) !== undefined);

    const generator = shapeLine<T>()
      .x((datum) => placeOn(xScale, x(datum)) ?? 0)
      .y((datum) => place(yScale, y(datum)));

    return generator(drawable) ?? undefined;
  };

  return (
    <path
      style={local.color ? { color: local.color } : undefined}
      {...dropAddress(rest)}
      d={d()}
      fill="none"
      stroke="currentColor"
      {...anatomyParts.line.attrs}
    />
  );
}
