import { layoutSelf } from "@web-core/skin";
import { Key } from "@web-core/solid/keyed";
import type { Draft } from "@web-core/store/mutate";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import { Show, type Accessor, type JSX } from "@web-core/solid";

import { presetsStore, type Preset } from "../models";

const NO_RECORDS = "Записей пока нет";
const BROKEN_CONTENT = "Содержимое записи не того вида";

export function Presets<T>(props: {
  kind: string;
  as: (content: unknown) => T | undefined;
  empty?: string;
  broken?: string;
  children: (
    preset: Accessor<Preset>,
    content: Accessor<T>,
    edit: (recipe: (draft: Draft<T>) => void) => void,
  ) => JSX.Element;
}) {
  const records = () => presetsStore.selectors.presetsOf(props.kind);

  return (
    <Flow data-variant="column">
      <Show
        when={records().length > 0}
        fallback={<Typography>{props.empty ?? NO_RECORDS}</Typography>}
      >
        <Key each={records()} by="id">
          {(preset) => (
            <FlowItem style={layoutSelf({ align: "stretch" })}>
              <Show
                when={props.as(preset().content)}
                fallback={<Typography>{props.broken ?? BROKEN_CONTENT}</Typography>}
              >
                {(content) =>
                  props.children(preset, content, (recipe) =>
                    presetsStore.actions.edit<T>(preset().id, recipe),
                  )
                }
              </Show>
            </FlowItem>
          )}
        </Key>
      </Show>
    </Flow>
  );
}
