import { Flow, FlowItem, Typography } from "@web-core/ui";
import { For, Show, type JSX } from "solid-js";

import { schemasStore, type Schema } from "../models";
import { SchemaCard } from "./schema";

export function Schemas(props: { children?: (schema: Schema) => JSX.Element }) {
  const state = schemasStore.use();

  return (
    <Flow data-variant="column">
      <Show
        when={state().schemas.length > 0}
        fallback={<Typography>Схем пока нет — загрузите документ</Typography>}
      >
        <For each={state().schemas}>
          {(schema) => (
            <FlowItem>
              <SchemaCard schema={schema}>{props.children}</SchemaCard>
            </FlowItem>
          )}
        </For>
      </Show>
    </Flow>
  );
}
