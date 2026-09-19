import { layoutSelf } from "@web-core/skin";
import { Flow, FlowItem } from "@web-core/ui";
import { createSignal } from "@web-core/solid";

import {
  endpointOf,
  type EndpointDescriptor,
  type InvokeResult,
  type SchemaNode,
} from "../../../../entities/openapi";
import { Call } from "./call";
import { Config } from "./config";

export function Endpoint(props: {
  endpoint: EndpointDescriptor;
  defs: Readonly<Record<string, SchemaNode>>;
  onResult?: (result: InvokeResult) => void;
}) {
  const endpoint = () => endpointOf(props.endpoint, props.defs);

  const [value, setValue] = createSignal<unknown>({});

  return (
    <Flow data-variant="column">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Config
          schema={endpoint().schema}
          value={value()}
          onChange={setValue}
        />
      </FlowItem>

      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Call endpoint={endpoint()} value={value()} onResult={props.onResult} />
      </FlowItem>
    </Flow>
  );
}
