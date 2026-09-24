import type { ScaleBand, ScaleLinear, ScaleLogarithmic, ScaleTime } from "d3-scale";
import { For, Show, splitProps, type JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";

export type DiagramAxisOrientation = "x" | "y";

/** Непрерывная шкала — деления считает она сама (`ticks`). */
export type DiagramContinuousScale =
  | ScaleLinear<number, number>
  | ScaleTime<number, number>
  | ScaleLogarithmic<number, number>;

/** Категориальная шкала — деления это её домен, `ticks` у неё нет вовсе. */
export type DiagramBandScale = ScaleBand<string>;

export type DiagramScale = DiagramContinuousScale | DiagramBandScale;

export type DiagramTickValue = number | string | Date;

export function isBandScale(scale: DiagramScale): scale is DiagramBandScale {
  return "bandwidth" in scale;
}

/** Положение значения на непрерывной шкале. Сигнатура временной шкалы — самая широкая из трёх
 * (`Date | NumberValue`), остальные две принимают её вход как есть (`FAQ.md`). */
export function place(scale: DiagramContinuousScale, value: number | Date): number {
  return (scale as ScaleTime<number, number>)(value);
}

/** Положение значения на ЛЮБОЙ шкале: у полосовой — центр полосы своей категории (значение
 * приводится к строке — домен полос строковый), у непрерывной — обычный пересчёт. `undefined` —
 * категории нет в домене: точку рисовать не по чему. */
export function placeOn(scale: DiagramScale, value: number | string | Date): number | undefined {
  if (!isBandScale(scale)) return place(scale, value instanceof Date ? value : Number(value));

  const at = scale(String(value));
  return at === undefined ? undefined : at + scale.bandwidth() / 2;
}

/** Деления шкалы вместе с их положением в пикселях — у полос это центр полосы. */
export function ticksOf(scale: DiagramScale, count?: number): readonly { value: DiagramTickValue; at: number }[] {
  if (isBandScale(scale)) {
    const shift = scale.bandwidth() / 2;
    return scale.domain().flatMap((value) => {
      const at = scale(value);
      return at === undefined ? [] : [{ value, at: at + shift }];
    });
  }

  return scale.ticks(count ?? 5).map((value: number | Date) => ({ value, at: place(scale, value) }));
}

export function edgesOf(scale: DiagramScale): readonly [number, number] {
  const range = scale.range();
  return [range[0] ?? 0, range[range.length - 1] ?? 0];
}

export type DiagramAxisProps = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children"> & {
  /** Посчитана корнем (или вызывающим) и передана явно — часть сама шкалу не считает и не хранит. */
  scale?: DiagramScale;
  orientation?: DiagramAxisOrientation;
  /** Сколько делений попросить у непрерывной шкалы; у категориальной не значит ничего. */
  ticks?: number;
  tickFormat?: (value: DiagramTickValue) => string;
  /** Где на ПОПЕРЕЧНОЙ оси стоит эта ось — x-оси своя позиция по y, и наоборот. */
  offset?: number;
};

const DEFAULT_TICK_FORMAT = (value: DiagramTickValue): string =>
  value instanceof Date ? value.toLocaleDateString() : String(value);

export function DiagramAxis(props: DiagramAxisProps) {
  traceLife("ui.diagram-axis");

  const [local, rest] = splitProps(props, ["scale", "orientation", "ticks", "tickFormat", "offset"]);
  const format = () => local.tickFormat ?? DEFAULT_TICK_FORMAT;
  const offset = () => local.offset ?? 0;

  return (
    <g
      {...dropAddress(rest)}
      data-orientation={local.orientation}
      {...anatomyParts.axis.attrs}
    >
      <Show when={local.scale}>
        {(scale) => {
          const edges = () => edgesOf(scale());
          const values = () => ticksOf(scale(), local.ticks);

          return (
            <>
              <line
                x1={local.orientation === "x" ? edges()[0] : offset()}
                y1={local.orientation === "x" ? offset() : edges()[0]}
                x2={local.orientation === "x" ? edges()[1] : offset()}
                y2={local.orientation === "x" ? offset() : edges()[1]}
                fill="none"
                stroke="currentColor"
              />
              <For each={values()}>
                {(tick) =>
                  local.orientation === "x" ? (
                    <g transform={`translate(${tick.at}, ${offset()})`}>
                      <line y2={6} fill="none" stroke="currentColor" />
                      <text y={9} dy="0.71em" text-anchor="middle" fill="currentColor">
                        {format()(tick.value)}
                      </text>
                    </g>
                  ) : (
                    <g transform={`translate(${offset()}, ${tick.at})`}>
                      <line x2={-6} fill="none" stroke="currentColor" />
                      <text x={-9} dy="0.32em" text-anchor="end" fill="currentColor">
                        {format()(tick.value)}
                      </text>
                    </g>
                  )
                }
              </For>
            </>
          );
        }}
      </Show>
    </g>
  );
}
