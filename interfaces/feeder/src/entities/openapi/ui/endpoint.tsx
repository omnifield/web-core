import { Flow, Typography } from "@web-core/ui";
import { Show } from "@web-core/solid";

import type { OpenapiEndpoint } from "../models";

export function Endpoint(props: { endpoint: OpenapiEndpoint }) {
  return (
    <Flow>
      <Typography>{props.endpoint.method}</Typography>
      <Typography>{props.endpoint.url}</Typography>
      <Show when={props.endpoint.tag}>{(tag) => <Typography>{tag()}</Typography>}</Show>
    </Flow>
  );
}
