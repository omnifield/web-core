import { layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import type { Accessor, JSX } from "@web-core/solid";

import type { Preset } from "../models";

export function PresetCard(props: {
  preset: Preset;
  children?: (preset: Accessor<Preset>) => JSX.Element;
}) {
  return (
    <Flow style={layoutSelf({ align: "stretch" })}>
      <FlowItem style={layoutSelf({ grow: true })}>
        <Typography>{props.preset.name}</Typography>
      </FlowItem>
      {props.children?.(() => props.preset)}
    </Flow>
  );
}
