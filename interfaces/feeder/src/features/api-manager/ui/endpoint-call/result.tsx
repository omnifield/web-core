import { Flow, FlowItem, Typography } from "@web-core/ui";

import type { InvokeResult } from "../../../../entities/openapi";

export function CallResult(props: { result: InvokeResult }) {
  return (
    <Flow data-variant="column">
      <FlowItem>
        <Typography>
          Ответ: {props.result.status} {props.result.ok ? "ok" : "не ok"}
        </Typography>
      </FlowItem>
      <FlowItem>
        <Typography>{JSON.stringify(props.result.body, null, 2)}</Typography>
      </FlowItem>
    </Flow>
  );
}
