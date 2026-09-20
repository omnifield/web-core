import { Passport, Distributor } from "#/features/preview";
import { Flow, FlowItem, Surface } from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";

export function PreviewArea() {
  return (
    <Surface data-variant="filled">
      <Flow data-variant="column-center">
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Flow style={layoutGroup({ justify: "space-between" })}>
            <Passport />
          </Flow>
        </FlowItem>
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Distributor />
        </FlowItem>
      </Flow>
    </Surface>
  );
}
