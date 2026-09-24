import type { FieldRef, FieldRule, PathType } from "@web-core/io";
import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Typography } from "@web-core/ui";

import { InputFields, OutputSlots } from "../../../entities/adapter";

const OUTPUT = "Выход";
const INPUT = "Вход";

export function Mastering(props: {
  output: readonly PathType[];
  input: readonly PathType[];
  rules?: readonly FieldRule[];
  onLink?: (link: { target: FieldRef; from: FieldRef }) => void;
  onUnlink?: (target: FieldRef) => void;
}) {
  return (
    <Flow style={layoutGroup({ align: "start", gap: "space-4", wrap: false })}>
      <FlowItem style={layoutSelf({ grow: true, shrink: true })}>
        <Flow data-variant="column">
          <Typography>{OUTPUT}</Typography>
          <OutputSlots
            paths={props.output}
            rules={props.rules}
            onLink={props.onLink}
            onUnlink={props.onUnlink}
          />
        </Flow>
      </FlowItem>

      <FlowItem style={layoutSelf({ grow: true, shrink: true })}>
        <Flow data-variant="column">
          <Typography>{INPUT}</Typography>
          <InputFields paths={props.input} />
        </Flow>
      </FlowItem>
    </Flow>
  );
}
