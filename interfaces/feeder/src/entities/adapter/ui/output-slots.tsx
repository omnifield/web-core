import type { FieldRef, FieldRule, PathType } from "@web-core/io";
import { createMemo, For, Show } from "@web-core/solid";
import { Flow, Typography } from "@web-core/ui";

import { useDragging } from "../../../shared";
import { layoutOf } from "../models";
import { GroupRow } from "./group-row";
import { SlotRow } from "./slot-row";

const NO_SLOTS = "Слотов на выходе нет";

export function OutputSlots(props: {
  paths: readonly PathType[];
  rules?: readonly FieldRule[];
  onLink?: (link: { target: FieldRef; from: FieldRef }) => void;
  onUnlink?: (target: FieldRef) => void;
  empty?: string;
}) {
  const carried = useDragging();
  const rows = createMemo(() => layoutOf(props.paths));

  const carriedType = () => {
    const type = carried()?.type;
    return typeof type === "string" ? type : undefined;
  };

  const filling = (target: FieldRef) =>
    props.rules?.find((rule) => rule.target === target)?.from;

  return (
    <Flow data-variant="column" data-block="output">
      <Show
        when={rows().length > 0}
        fallback={<Typography>{props.empty ?? NO_SLOTS}</Typography>}
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
              {(slot) => (
                <SlotRow
                  name={slot().name}
                  path={slot().path}
                  type={slot().type}
                  depth={slot().depth}
                  from={filling(slot().path)}
                  carriedType={carriedType()}
                  onDrop={(data) => {
                    const from = data.from;
                    if (typeof from === "string") {
                      props.onLink?.({ target: slot().path, from });
                    }
                  }}
                  onUnlink={
                    props.onUnlink === undefined
                      ? undefined
                      : () => props.onUnlink?.(slot().path)
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
