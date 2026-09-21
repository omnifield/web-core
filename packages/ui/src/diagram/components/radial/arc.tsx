import { arc as shapeArc, pie as shapePie, type PieArcDatum } from "d3-shape";
import { For, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type DiagramArcProps<T> = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children"> & {
  data?: readonly T[];
  /** Достаёт долю одной записи; углы считаются от суммы всех долей серии. */
  value: (datum: T) => number;
  /** Центр круга в координатах показа — считает вызывающий, часть своей геометрии не хранит. */
  cx?: number;
  cy?: number;
  radius?: number;
  /** Дырка в центре: 0 — сплошной пирог, доля от радиуса — бублик. */
  innerRatio?: number;
  /** Готовое CSS-значение на всю серию; не задано — красит рецепт (`FAQ.md`). */
  color?: string;
  /** Цвет ОТДЕЛЬНОГО сектора из данных — сильнее, чем `color`. */
  colorOf?: (datum: T) => string | undefined;
};

interface Sector {
  d: string;
  color?: string;
}

export function DiagramArc<T>(props: DiagramArcProps<T>) {
  traceLife("ui.diagram-arc");

  const [local, rest] = splitProps(props, [
    "data",
    "value",
    "cx",
    "cy",
    "radius",
    "innerRatio",
    "color",
    "colorOf",
  ]);

  const sectors = (): readonly Sector[] => {
    const data = local.data;
    const value = local.value;
    const radius = local.radius ?? 0;

    if (!data || radius <= 0) return [];

    const inner = radius * Math.min(Math.max(local.innerRatio ?? 0, 0), 0.95);
    const layout = shapePie<T>().sort(null).value(value);
    const generator = shapeArc<PieArcDatum<T>>().innerRadius(inner).outerRadius(radius);

    return layout([...data]).flatMap((slice) => {
      const d = generator(slice);
      return d === null ? [] : [{ d, color: local.colorOf?.(slice.data) }];
    });
  };

  return (
    <g
      style={local.color ? { color: local.color } : undefined}
      {...dropAddress(rest)}
      transform={`translate(${local.cx ?? 0}, ${local.cy ?? 0})`}
      {...anatomyParts.arc.attrs}
    >
      <For each={sectors()}>
        {(sector) => (
          <path d={sector.d} style={sector.color ? { color: sector.color } : undefined} fill="currentColor" />
        )}
      </For>
    </g>
  );
}
