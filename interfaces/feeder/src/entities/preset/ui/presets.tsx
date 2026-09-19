import { Key } from "@web-core/solid/keyed";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import { Show, type Accessor, type JSX } from "@web-core/solid";

import { presetsStore, type Preset } from "../models";
import { PresetCard } from "./preset";

export function Presets(props: { children?: (preset: Accessor<Preset>) => JSX.Element }) {
  const state = presetsStore.use();

  return (
    <Flow data-variant="column">
      <Show
        when={state().presets.length > 0}
        fallback={<Typography>Пресетов пока нет — загрузите документ</Typography>}
      >
        <Key each={state().presets} by="id">
          {(preset) => (
            <FlowItem>
              <PresetCard preset={preset()}>{props.children}</PresetCard>
            </FlowItem>
          )}
        </Key>
      </Show>
    </Flow>
  );
}
