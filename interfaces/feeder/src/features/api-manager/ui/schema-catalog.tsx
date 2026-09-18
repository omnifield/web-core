import { layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import { For, Show } from "solid-js";

import { Endpoints } from "../../../entities/openapi";
import { schemasStore } from "../../../entities/schema";

export function SchemaCatalog() {
  const state = schemasStore.use();

  return (
    <Flow data-variant="column">
      <Show
        when={state().schemas.length > 0}
        fallback={<Typography>Схем пока нет — загрузите документ</Typography>}
      >
        <For each={state().schemas}>
          {(schema) => (
            <FlowItem style={layoutSelf({ align: "stretch" })}>
              <Endpoints
                label={schema.name}
                endpoints={[]}
                onRemove={() => schemasStore.actions.remove(schema.id)}
              />
            </FlowItem>
          )}
        </For>
      </Show>
    </Flow>
  );
}
