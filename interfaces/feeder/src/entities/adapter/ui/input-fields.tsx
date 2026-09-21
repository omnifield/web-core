import type { PathType } from "@web-core/io";
import { createMemo, For, Show } from "@web-core/solid";
import { Flow, Typography } from "@web-core/ui";

import { dragSource } from "../../../shared";
import { layoutOf } from "../models";
import { FieldRow } from "./field-row";
import { GroupRow } from "./group-row";

const NO_FIELDS = "Полей на входе нет";

export function InputFields(props: { paths: readonly PathType[]; empty?: string }) {
  const rows = createMemo(() => layoutOf(props.paths));

  return (
    <Flow data-variant="column" data-block="input">
      <Show
        when={rows().length > 0}
        fallback={<Typography>{props.empty ?? NO_FIELDS}</Typography>}
      >
        <For each={rows()}>
          {(row) => (
            <Show
              when={row.kind === "field" ? row : undefined}
              fallback={
                <GroupRow
                  name={row.name}
                  repeated={row.kind === "group" && row.repeated}
                  depth={row.depth}
                />
              }
            >
              {(field) => (
                <FieldRow
                  name={field().name}
                  path={field().path}
                  type={field().type}
                  depth={field().depth}
                  ref={(element) =>
                    dragSource(element, () => ({ from: field().path, type: field().type }))
                  }
                />
              )}
            </Show>
          )}
        </For>
      </Show>
    </Flow>
  );
}
