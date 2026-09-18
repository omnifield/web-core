import { layoutSelf } from "@web-core/skin";
import { Button, Flow, FlowItem, Typography } from "@web-core/ui";
import { createSignal, Show } from "solid-js";

import { Tree } from "../../../../entities/form";
import type { OpenapiEndpoint } from "../../../../entities/openapi";
import { useInvoke } from "../../lib";
import { CallResult } from "./result";

export function EndpointCall(props: { endpoint: OpenapiEndpoint }) {
  const [value, setValue] = createSignal<unknown>({});
  const invocation = useInvoke(() => props.endpoint);

  return (
    <Flow data-variant="column">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Tree schema={props.endpoint.schema} value={value()} onChange={setValue} />
      </FlowItem>

      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Button
          style={{ width: "100%" }}
          disabled={invocation.pending()}
          onClick={() => void invocation.call(value())}
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

      <Show when={invocation.result()}>
        {(result) => (
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <CallResult result={result()} />
          </FlowItem>
        )}
      </Show>
    </Flow>
  );
}
