import { layoutSelf } from "@web-core/skin";
import { Button, Flow, FlowItem, Typography } from "@web-core/ui";
import { createSignal, Show } from "@web-core/solid";

import { Tree } from "../../../../entities/form";
import {
  endpointOf,
  type EndpointDescriptor,
  type InvokeResult,
  type SchemaNode,
} from "../../../../entities/openapi";
import { useInvoke } from "../../lib";

export function EndpointCall(props: {
  endpoint: EndpointDescriptor;
  defs: Readonly<Record<string, SchemaNode>>;
  onResult?: (result: InvokeResult) => void;
}) {
  const endpoint = () => endpointOf(props.endpoint, props.defs);

  const [value, setValue] = createSignal<unknown>({});
  const invocation = useInvoke(endpoint);

  async function check() {
    await invocation.call(value());

    const result = invocation.result();
    if (result !== undefined) props.onResult?.(result);
  }

  return (
    <Flow data-variant="column">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Tree schema={endpoint().schema} value={value()} onChange={setValue} />
      </FlowItem>

      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Button
          style={{ width: "100%" }}
          disabled={invocation.pending()}
          onClick={() => void check()}
        >
          {invocation.pending() ? "Дёргаем…" : "Проверить"}
        </Button>
      </FlowItem>

      <Show when={invocation.failure()}>
        {(failure) => (
          <FlowItem>
            <Typography>Вызов не дошёл: {failure()}</Typography>
          </FlowItem>
        )}
      </Show>
    </Flow>
  );
}
