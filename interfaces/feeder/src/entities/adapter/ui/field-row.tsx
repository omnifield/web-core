import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Icon, Typography } from "@web-core/ui";

import { TypeMark } from "./type-mark";

const ROW = {
  border: "var(--border-width) solid var(--neutral-6)",
  "border-radius": "var(--radius)",
  padding: "var(--space-1) var(--space-2)",
  background: "var(--neutral-2)",
  cursor: "grab",
};

export function FieldRow(props: {
  name: string;
  path: string;
  type: string;
  depth: number;
  ref?: (element: HTMLElement) => void;
}) {
  return (
    <FlowItem
      ref={props.ref}
      data-type={props.type}
      title={props.path}
      style={{
        ...layoutSelf({ align: "stretch" }),
        ...ROW,
        "margin-inline-start": `calc(var(--space-4) * ${props.depth})`,
      }}
    >
      <Flow style={layoutGroup({ align: "center", gap: "space-2", wrap: false })}>
        <Icon name="grip-vertical" />
        <TypeMark type={props.type} />
        <Typography>{props.name}</Typography>
      </Flow>
    </FlowItem>
  );
}
