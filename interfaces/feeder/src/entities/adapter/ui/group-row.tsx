import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Show } from "@web-core/solid";
import { Flow, FlowItem, Typography } from "@web-core/ui";

const REPEATED = "каждый пункт";

export function GroupRow(props: { name: string; repeated: boolean; depth: number }) {
  return (
    <FlowItem
      style={{
        ...layoutSelf({ align: "stretch" }),
        "padding-inline-start": `calc(var(--space-4) * ${props.depth})`,
        "padding-block-start": "var(--space-2)",
      }}
    >
      <Flow style={layoutGroup({ align: "baseline", gap: "space-2", wrap: false })}>
        <Typography style={{ color: "var(--neutral-11)" }}>{props.name}</Typography>
        <Show when={props.repeated}>
          <Typography style={{ color: "var(--neutral-9)" }}>· {REPEATED}</Typography>
        </Show>
      </Flow>
    </FlowItem>
  );
}
