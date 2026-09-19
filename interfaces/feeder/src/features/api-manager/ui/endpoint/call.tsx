import { layoutSelf } from "@web-core/skin";
import { Button, Flow, FlowItem, Typography } from "@web-core/ui";
import { Show } from "@web-core/solid";

import type { InvokeResult, OpenapiEndpoint } from "../../../../entities/openapi";
import { useInvoke } from "../../lib";

export function Call(props: {
  endpoint: OpenapiEndpoint;
  value: unknown;
  onResult?: (result: InvokeResult) => void;
}) {
  const invocation = useInvoke(() => props.endpoint);

  async function check() {
    await invocation.call(props.value);

    const result = invocation.result();
    if (result !== undefined) props.onResult?.(result);
  }

  return (
    <Flow data-variant="column">
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
