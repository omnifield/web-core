import type { PathType } from "@web-core/io";
import { For, Show } from "@web-core/solid";
import { Flow, Typography } from "@web-core/ui";

import { dragSource } from "../../../shared";
import { FieldRow } from "./field-row";

const NO_FIELDS = "Полей на входе нет";

export function InputFields(props: { paths: readonly PathType[]; empty?: string }) {
  return (
    <Flow data-variant="column" data-block="input">
      <Show
        when={props.paths.length > 0}
        fallback={<Typography>{props.empty ?? NO_FIELDS}</Typography>}
      >
        <For each={props.paths}>
          {(field) => (
            <FieldRow
              path={field.path}
              type={field.type}
              ref={(element) =>
                dragSource(element, () => ({ from: field.path, type: field.type }))
              }
            />
          )}
        </For>
      </Show>
    </Flow>
  );
}
