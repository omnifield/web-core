import { layoutSelf } from "@web-core/skin";
import type { z } from "@web-core/io";
import { Flow, FlowItem } from "@web-core/ui";

import { Tree } from "../../../../entities/form";

export function Config(props: {
  schema: z.ZodType;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <Flow data-variant="column">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Tree schema={props.schema} value={props.value} onChange={props.onChange} />
      </FlowItem>
    </Flow>
  );
}
