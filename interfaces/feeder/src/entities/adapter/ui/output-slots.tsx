import type { FieldRef, FieldRule, PathType } from "@web-core/io";
import { For, Show } from "@web-core/solid";
import { Flow, Typography } from "@web-core/ui";

import { useDragging } from "../../../shared";
import { SlotRow } from "./slot-row";

const NO_SLOTS = "Слотов на выходе нет";

export function OutputSlots(props: {
  paths: readonly PathType[];
  rules?: readonly FieldRule[];
  onLink?: (link: { target: FieldRef; from: FieldRef }) => void;
  onUnlink?: (target: FieldRef) => void;
  empty?: string;
}) {
  const dragging = useDragging();

  const filling = (target: FieldRef) =>
    props.rules?.find((rule) => rule.target === target)?.from;

  return (
    <Flow data-variant="column" data-block="output">
      <Show
        when={props.paths.length > 0}
        fallback={<Typography>{props.empty ?? NO_SLOTS}</Typography>}
      >
        <For each={props.paths}>
          {(slot) => (
            <SlotRow
              path={slot.path}
              type={slot.type}
              from={filling(slot.path)}
              armed={dragging()}
              onDrop={(data) => {
                const from = data.from;
                if (typeof from === "string") {
                  props.onLink?.({ target: slot.path, from });
                }
              }}
              onUnlink={
                props.onUnlink === undefined ? undefined : () => props.onUnlink?.(slot.path)
              }
            />
          )}
        </For>
      </Show>
    </Flow>
  );
}
