import { layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import type { JSX } from "solid-js";

import type { Schema } from "../models";

export function SchemaCard(props: {
  schema: Schema;
  children?: (schema: Schema) => JSX.Element;
}) {
  return (
    <Flow style={layoutSelf({ align: "stretch" })}>
      <FlowItem style={layoutSelf({ grow: true })}>
        <Typography>{props.schema.name}</Typography>
      </FlowItem>
      {props.children?.(props.schema)}
    </Flow>
  );
}
