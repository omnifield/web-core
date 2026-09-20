import { layoutSelf } from "@web-core/skin";
import { Flow, FlowItem } from "@web-core/ui";
import { createSignal } from "@web-core/solid";

import {
  endpointOf,
  type EndpointDescriptor,
  type InvokeResult,
  type SchemaNode,
} from "../../../../entities/openapi";
import type { Serving, Users } from "../../lib";
import { Call } from "./call";
import { Config } from "./config";

export function Endpoint(props: {
  endpoint: EndpointDescriptor;
  defs: Readonly<Record<string, SchemaNode>>;
  users?: Users;
  onResult?: (result: InvokeResult) => void;
  onServing?: (serving: Serving) => void;
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
        <Call
          endpoint={endpoint()}
          value={value()}
          users={props.users}
          onResult={props.onResult}
          onServing={props.onServing}
        />
      </FlowItem>
    </Flow>
  );
}
