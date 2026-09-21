import { For, Show, type JSX } from "solid-js";

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
import type { DiagramFrame } from "./root.js";

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
export function DefaultDiagramBody(props: { frame: DiagramFrame; grid?: boolean }): JSX.Element {
  const bandX = () =>
    isBandScale(props.frame.xScale) ? (props.frame.xScale as DiagramBandScale) : undefined;
  const continuousY = () =>
    isBandScale(props.frame.yScale) ? undefined : (props.frame.yScale as DiagramContinuousScale);

  return (
    <>
      <Show when={props.grid ?? true}>
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
                  {(xScale) => (
                    <DiagramBar
                      data={props.frame.data}
                      xScale={xScale()}
                      yScale={yScale()}
                      x={(row) => String(row[spec.x])}
                      y={(row) => readNumber(row, spec.y)}
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

      <For each={props.frame.axes}>
        {(axis) => (
          <Show when={axis.hidden !== true}>
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
