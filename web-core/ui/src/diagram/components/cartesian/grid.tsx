import { For, Show, splitProps, type JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";
import { ticksOf, type DiagramAxisOrientation, type DiagramScale } from "./axis.js";

export type DiagramGridProps = Omit<JSX.SvgSVGAttributes<SVGGElement>, "children"> & {
  /** Та же шкала, что несёт соответствующая `axis` — деления берутся из неё же, не пересчитываются. */
  scale?: DiagramScale;
  orientation?: DiagramAxisOrientation;
  ticks?: number;
  /** Где линии начинаются на ПОПЕРЕЧНОЙ оси — обычно край диапазона другой шкалы. */
  from?: number;
  /** Где линии заканчиваются на ПОПЕРЕЧНОЙ оси. */
  to?: number;
};

export function DiagramGrid(props: DiagramGridProps) {
  traceLife("ui.diagram-grid");

  const [local, rest] = splitProps(props, ["scale", "orientation", "ticks", "from", "to"]);
  const from = () => local.from ?? 0;
  const to = () => local.to ?? 0;

  return (
    <g
      {...dropAddress(rest)}
      data-orientation={local.orientation}
      {...anatomyParts.grid.attrs}
    >
      <Show when={local.scale}>
        {(scale) => (
          <For each={ticksOf(scale(), local.ticks)}>
            {(tick) =>
              local.orientation === "x" ? (
                <line x1={tick.at} y1={from()} x2={tick.at} y2={to()} fill="none" stroke="currentColor" />
              ) : (
                <line x1={from()} y1={tick.at} x2={to()} y2={tick.at} fill="none" stroke="currentColor" />
              )
            }
          </For>
        )}
      </Show>
    </g>
  );
}
