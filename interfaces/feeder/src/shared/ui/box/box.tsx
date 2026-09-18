import { Accordion } from "@web-core/ui";
import { For, Show, type JSX } from "solid-js";

import { Node } from "./node";

export function Box<T>(props: {
  label?: string;
  onAddChild?: () => void;
  onRemove?: () => void;
  items: readonly T[];
  itemKey: (item: T) => string;
  itemLabel: (item: T) => string;
  onItemAddChild?: (item: T) => void;
  onItemRemove?: (item: T) => void;
  children: (item: T) => JSX.Element;
}) {
  const nodes = () => (
    <Accordion collapsible multiple data-variant="cards">
      <For each={props.items}>
        {(item) => (
          <Node
            value={props.itemKey(item)}
            label={props.itemLabel(item)}
            onAddChild={
              props.onItemAddChild === undefined
                ? undefined
                : () => props.onItemAddChild?.(item)
            }
            onRemove={
              props.onItemRemove === undefined
                ? undefined
                : () => props.onItemRemove?.(item)
            }
          >
            {props.children(item)}
          </Node>
        )}
      </For>
    </Accordion>
  );

  return (
    <Show when={props.label} fallback={nodes()}>
      {(label) => (
        <Accordion collapsible data-variant="cards">
          <Node
            value="box"
            label={label()}
            onAddChild={props.onAddChild}
            onRemove={props.onRemove}
          >
            {nodes()}
          </Node>
        </Accordion>
      )}
    </Show>
  );
}
