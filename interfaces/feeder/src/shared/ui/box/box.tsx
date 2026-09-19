import { Key } from "@web-core/solid/keyed";
import { Accordion } from "@web-core/ui";
import { Show, type Accessor, type JSX } from "@web-core/solid";

import { Node } from "./node";

export function Box<T>(props: {
  label?: string;
  onConfig?: (item?: T) => void;
  onAddChild?: () => void;
  onRemove?: () => void;
  items: readonly T[];
  itemKey: (item: T) => string;
  itemLabel: (item: T) => string;
  onItemAddChild?: (item: T) => void;
  onItemRemove?: (item: T) => void;
  children: (item: Accessor<T>) => JSX.Element;
}) {
  const nodes = () => (
    <Accordion collapsible multiple data-variant="cards">
      <Key each={props.items} by={props.itemKey}>
        {(item) => (
          <Node
            value={props.itemKey(item())}
            label={props.itemLabel(item())}
            onConfig={
              props.onConfig === undefined
                ? undefined
                : () => props.onConfig?.(item())
            }
            onAddChild={
              props.onItemAddChild === undefined
                ? undefined
                : () => props.onItemAddChild?.(item())
            }
            onRemove={
              props.onItemRemove === undefined
                ? undefined
                : () => props.onItemRemove?.(item())
            }
          >
            {props.children(item)}
          </Node>
        )}
      </Key>
    </Accordion>
  );

  return (
    <Show when={props.label} fallback={nodes()}>
      {(label) => (
        <Accordion collapsible data-variant="cards">
          <Node
            value="box"
            label={label()}
            onConfig={props.onConfig}
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
