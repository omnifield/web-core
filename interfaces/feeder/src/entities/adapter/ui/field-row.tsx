import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Icon, Typography } from "@web-core/ui";

const ROW = {
  border: "var(--border-width) solid var(--neutral-6)",
  "border-radius": "var(--radius)",
  padding: "var(--space-1) var(--space-2)",
  background: "var(--neutral-2)",
  cursor: "grab",
};

export function FieldRow(props: {
  path: string;
  type: string;
  ref?: (element: HTMLElement) => void;
}) {
  return (
    <FlowItem
      ref={props.ref}
      data-type={props.type}
      style={{ ...layoutSelf({ align: "stretch" }), ...ROW }}
    >
      <Flow style={layoutGroup({ align: "center", gap: "space-2", wrap: false })}>
        <Icon name="grip-vertical" />
        <Typography>{props.path}</Typography>
        <Typography style={{ color: "var(--neutral-11)" }}>{props.type}</Typography>
      </Flow>
    </FlowItem>
  );
}
