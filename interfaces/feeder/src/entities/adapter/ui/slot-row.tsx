import { layoutGroup, layoutSelf } from "@web-core/skin";
import { createSignal, Show } from "@web-core/solid";
import { Button, Flow, FlowItem, Icon, Typography } from "@web-core/ui";

import { dropTarget } from "../../../shared";
import { fitOf, type Fit } from "../models";
import { TypeMark } from "./type-mark";

const EMPTY = "перетащите поле";
const RISKY = "нужна проверка";

const WELL = {
  "border-radius": "var(--radius)",
  padding: "var(--space-1) var(--space-2)",
  "min-height": "var(--control-height)",
};

const CHIP = {
  border: "var(--border-width) solid var(--accent-7)",
  "border-radius": "var(--radius)",
  padding: "0 var(--space-1)",
  background: "var(--accent-3)",
};

export function SlotRow(props: {
  path: string;
  type: string;
  from?: string;
  carriedType?: string;
  onDrop: (data: Record<string, unknown>) => void;
  onUnlink?: () => void;
}) {
  const [over, setOver] = createSignal(false);

  const fit = (): Fit | undefined =>
    props.carriedType === undefined ? undefined : fitOf(props.carriedType, props.type);

  const border = () => {
    if (over()) return "var(--border-width) solid var(--accent-9)";
    if (fit() === "exact") return "var(--border-width) solid var(--accent-7)";
    if (props.from !== undefined) return "var(--border-width) solid var(--neutral-6)";
    return "var(--border-width) dashed var(--neutral-6)";
  };

  const background = () => {
    if (over()) return "var(--accent-2)";
    if (fit() === "exact" || fit() === "safe") return "var(--neutral-2)";
    return "transparent";
  };

  return (
    <FlowItem
      ref={(element: HTMLElement) =>
        dropTarget(element, { onOver: setOver, onDrop: props.onDrop })
      }
      data-type={props.type}
      data-filled={props.from === undefined ? undefined : ""}
      data-fit={fit()}
      style={{
        ...layoutSelf({ align: "stretch" }),
        ...WELL,
        border: border(),
        background: background(),
        opacity: fit() === "risky" ? "0.55" : "1",
      }}
    >
      <Flow style={layoutGroup({ align: "center", gap: "space-2", wrap: false })}>
        <TypeMark type={props.type} />
        <Typography>{props.path}</Typography>

        <Show
          when={props.from}
          fallback={
            <Typography style={{ color: "var(--neutral-11)" }}>
              {fit() === "risky" ? RISKY : EMPTY}
            </Typography>
          }
        >
          {(from) => (
            <Flow
              style={{ ...layoutGroup({ align: "center", gap: "space-1", wrap: false }), ...CHIP }}
            >
              <Typography>{from()}</Typography>
              <Show when={props.onUnlink}>
                {(unlink) => (
                  <Button aria-label="Снять" onClick={() => unlink()()}>
                    <Icon name="x" />
                  </Button>
                )}
              </Show>
            </Flow>
          )}
        </Show>
      </Flow>
    </FlowItem>
  );
}
