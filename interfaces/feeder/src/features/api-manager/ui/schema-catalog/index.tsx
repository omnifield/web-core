import { Key } from "@web-core/solid/keyed";
import { Flow, Typography } from "@web-core/ui";
import { Show } from "@web-core/solid";

import { presetsStore } from "../../../../entities/preset";
import { PresetNode } from "./preset-node";

export function SchemaCatalog() {
  const state = presetsStore.use();

  return (
    <Flow data-variant="column">
      <Show
        when={state().presets.length > 0}
        fallback={<Typography>Схем пока нет — загрузите документ</Typography>}
      >
        <Key each={state().presets} by="id">
          {(preset) => <PresetNode preset={preset()} />}
        </Key>
      </Show>
    </Flow>
  );
}
