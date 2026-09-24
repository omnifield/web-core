import { area as shapeArea } from "d3-shape";
import { splitProps, type JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";
import { place, placeOn, type DiagramContinuousScale, type DiagramScale } from "./axis.js";

export type DiagramAreaProps<T> = Omit<JSX.SvgSVGAttributes<SVGPathElement>, "children" | "d" | "x" | "y"> & {
  data?: readonly T[];
  /** Любая шкала: у полосовой точка встаёт в центр своей полосы. */
  xScale?: DiagramScale;
  yScale?: DiagramContinuousScale;
  /** Достаёт значение по оси x из одной точки данных — само значение, не уже пересчитанный пиксель. */
  x: (datum: T) => number | string | Date;
  /** То же самое для верхнего края заливки — нижний край берётся с базовой линии `yScale`. */
  y: (datum: T) => number;
  /** Готовое CSS-значение из данных; не задано — красит рецепт (`FAQ.md`). */
  color?: string;
};

export function DiagramArea<T>(props: DiagramAreaProps<T>) {
  traceLife("ui.diagram-area");

  const [local, rest] = splitProps(props, ["data", "xScale", "yScale", "x", "y", "color"]);

  const d = (): string | undefined => {
    const data = local.data;
    const xScale = local.xScale;
    const yScale = local.yScale;
    const x = local.x;
    const y = local.y;

    if (!data || !xScale || !yScale) return undefined;

    const drawable = data.filter((datum) => placeOn(xScale, x(datum)) !== undefined);

    const baseline = yScale.range()[0];
    const generator = shapeArea<T>()
      .x((datum) => placeOn(xScale, x(datum)) ?? 0)
      .y0(baseline)
      .y1((datum) => place(yScale, y(datum)));

    return generator(drawable) ?? undefined;
  };

  return (
    <path
      style={local.color ? { color: local.color } : undefined}
      {...dropAddress(rest)}
      d={d()}
      stroke="none"
      fill="currentColor"
      {...anatomyParts.area.attrs}
    />
  );
}
