import { layoutSelf } from "@web-core/skin";
import { FlowItem, Typography } from "@web-core/ui";
import { createResource, Show } from "solid-js";

import { Endpoints, type OpenapiEndpoint } from "../../../../entities/openapi";
import { parseEndpoints } from "../../../../entities/openapi";
import { schemasStore, type Schema } from "../../../../entities/schema";
import { EndpointCall } from "../endpoint-call";

const NONE: readonly OpenapiEndpoint[] = [];

export function SchemaNode(props: { schema: Schema }) {
  const [endpoints] = createResource(() => props.schema.raw, parseEndpoints);

  const list = () => (endpoints.error === undefined ? (endpoints.latest ?? NONE) : NONE);

  return (
    <FlowItem style={layoutSelf({ align: "stretch" })}>
      <Endpoints
        label={props.schema.name}
        endpoints={list()}
        onRemove={() => schemasStore.actions.remove(props.schema.id)}
      >
        {(endpoint) => <EndpointCall endpoint={endpoint} />}
      </Endpoints>
      <Show when={endpoints.loading}>
        <Typography>Распознаём схему…</Typography>
      </Show>
      <Show when={endpoints.error}>
        {(error) => (
          <Typography>
            Схема не распозналась:{" "}
            {error() instanceof Error ? (error() as Error).message : String(error())}
          </Typography>
        )}
      </Show>
    </FlowItem>
  );
}
