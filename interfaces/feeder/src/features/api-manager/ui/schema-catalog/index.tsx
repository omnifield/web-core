import { Flow, Typography } from "@web-core/ui";
import { For, Show } from "solid-js";

import { schemasStore } from "../../../../entities/schema";
import { SchemaNode } from "./schema-node";

export function SchemaCatalog() {
  const state = schemasStore.use();

  return (
    <Flow data-variant="column">
      <Show
        when={state().schemas.length > 0}
        fallback={<Typography>Схем пока нет — загрузите документ</Typography>}
      >
        <For each={state().schemas}>{(schema) => <SchemaNode schema={schema} />}</For>
      </Show>
    </Flow>
  );
}
