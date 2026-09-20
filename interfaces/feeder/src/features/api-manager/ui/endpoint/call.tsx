import { layoutSelf } from "@web-core/skin";
import { Button, Flow, FlowItem, Typography } from "@web-core/ui";
import { Show } from "@web-core/solid";

import type { InvokeResult, OpenapiEndpoint } from "../../../../entities/openapi";
import { useInvoke, type Serving, type Users } from "../../lib";

export function Call(props: {
  endpoint: OpenapiEndpoint;
  value: unknown;
  users?: Users;
  onResult?: (result: InvokeResult) => void;
  onServing?: (serving: Serving) => void;
}) {
  const invocation = useInvoke(
    () => props.endpoint,
    () => props.users,
  );

  async function check() {
    await invocation.call(props.value);

    const result = invocation.result();
    if (result !== undefined) props.onResult?.(result);

    const serving = invocation.serving();
    if (serving !== undefined) props.onServing?.(serving);
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
