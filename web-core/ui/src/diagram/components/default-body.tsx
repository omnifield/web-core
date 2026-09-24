import { For, Show, type JSX } from "@web-core/solid";

import type { DiagramRow, DiagramSeriesSpec } from "../entity/io.js";
import { DiagramArea } from "./cartesian/area.js";
import {
  DiagramAxis,
  isBandScale,
  type DiagramBandScale,
  type DiagramContinuousScale,
} from "./cartesian/axis.js";
import { DiagramBar } from "./cartesian/bar.js";
import { DiagramGrid } from "./cartesian/grid.js";
import { DiagramLine } from "./cartesian/line.js";
import { DiagramPoint } from "./cartesian/point.js";
import { DiagramArc } from "./radial/arc.js";
import { isRadial, type DiagramFrame } from "./root.js";

function readNumber(row: DiagramRow, field: string): number {
  const value = row[field];
  return value instanceof Date ? value.getTime() : Number(value);
}

/** Координата как есть: дата — датой, число — числом, всё прочее — строкой (категорией). Куда
 * это ляжет в пикселях, решает шкала, а не читатель поля. */
function readCoord(row: DiagramRow, field: string): number | string | Date {
  const value = row[field];
  if (value instanceof Date) return value;
  if (typeof value === "number") return value;
  return String(value);
}

function colorOf(spec: DiagramSeriesSpec): ((row: DiagramRow) => string | undefined) | undefined {
  const field = spec.colorField;
  if (field === undefined) return undefined;

  return (row) => {
    const value = row[field];
    return typeof value === "string" ? value : undefined;
  };
}

/** Структура, которую корень растит сам, когда ему не передали `children` — оси, сетка и серии:
 * ЧТО показывать берётся из данных, ЧЕМ рисовать — из формы графика (`frame.shape`). Тот же
 * приём, что `DefaultTableBody` у таблицы. */
export function DefaultDiagramBody(props: {
  frame: DiagramFrame;
  grid?: boolean;
  innerRatio?: number;
}): JSX.Element {
  const radial = () => isRadial(props.frame.shape);
  const bandX = () =>
    isBandScale(props.frame.xScale) ? (props.frame.xScale as DiagramBandScale) : undefined;
  const bandY = () =>
    isBandScale(props.frame.yScale) ? (props.frame.yScale as DiagramBandScale) : undefined;
  const continuousX = () =>
    isBandScale(props.frame.xScale) ? undefined : (props.frame.xScale as DiagramContinuousScale);
  const continuousY = () =>
    isBandScale(props.frame.yScale) ? undefined : (props.frame.yScale as DiagramContinuousScale);

  return (
    <>
      <Show when={(props.grid ?? true) && !radial()}>
        <DiagramGrid
          scale={props.frame.xScale}
          orientation="x"
          from={props.frame.plot.top}
          to={props.frame.plot.bottom}
        />
        <DiagramGrid
          scale={props.frame.yScale}
          orientation="y"
          from={props.frame.plot.left}
          to={props.frame.plot.right}
        />
      </Show>

      <For each={props.frame.series}>
        {(spec) => (
          <Show when={continuousY()}>
            {(yScale) => (
              <>
                <Show when={props.frame.shape === "line"}>
                  <DiagramLine
                      data={props.frame.data}
                      xScale={props.frame.xScale}
                      yScale={yScale()}
                      x={(row) => readCoord(row, spec.x)}
                      y={(row) => readNumber(row, spec.y)}
                      color={spec.color}
                    />
                </Show>
                <Show when={props.frame.shape === "area"}>
                  <DiagramArea
                      data={props.frame.data}
                      xScale={props.frame.xScale}
                      yScale={yScale()}
                      x={(row) => readCoord(row, spec.x)}
                      y={(row) => readNumber(row, spec.y)}
                      color={spec.color}
                    />
                </Show>
                <Show when={props.frame.shape === "point"}>
                  <DiagramPoint
                      data={props.frame.data}
                      xScale={props.frame.xScale}
                      yScale={yScale()}
                      x={(row) => readCoord(row, spec.x)}
                      y={(row) => readNumber(row, spec.y)}
                      color={spec.color}
                      colorOf={colorOf(spec)}
                    />
                </Show>
                <Show when={props.frame.shape === "bar" && bandX()}>
                  {(categoryScale) => (
                    <DiagramBar<DiagramRow>
                      data={props.frame.data}
                      categoryScale={categoryScale()}
                      valueScale={yScale()}
                      category={(row) => String(row[spec.x])}
                      value={(row) => readNumber(row, spec.y)}
                      color={spec.color}
                      colorOf={colorOf(spec)}
                    />
                  )}
                </Show>
              </>
            )}
          </Show>
        )}
      </For>

      <For each={props.frame.series}>
        {(spec) => (
          <Show when={props.frame.shape === "bar-horizontal" && bandY()}>
            {(categoryScale) => (
              <Show when={continuousX()}>
                {(valueScale) => (
                  <DiagramBar<DiagramRow>
                    data={props.frame.data}
                    categoryScale={categoryScale()}
                    valueScale={valueScale()}
                    category={(row) => String(row[spec.x])}
                    value={(row) => readNumber(row, spec.y)}
                    orientation="horizontal"
                    color={spec.color}
                    colorOf={colorOf(spec)}
                  />
                )}
              </Show>
            )}
          </Show>
        )}
      </For>

      <For each={props.frame.series}>
        {(spec) => (
          <Show when={radial()}>
            <DiagramArc<DiagramRow>
              data={props.frame.data}
              value={(row) => readNumber(row, spec.y)}
              cx={props.frame.disc.cx}
              cy={props.frame.disc.cy}
              radius={props.frame.disc.radius}
              innerRatio={props.innerRatio}
              color={spec.color}
              colorOf={colorOf(spec)}
            />
          </Show>
        )}
      </For>

      <For each={props.frame.axes}>
        {(axis) => (
          <Show when={axis.hidden !== true && !radial()}>
            <DiagramAxis
              scale={axis.scale}
              orientation={axis.orientation}
              ticks={axis.ticks}
              offset={axis.offset}
            />
          </Show>
        )}
      </For>
    </>
  );
}
