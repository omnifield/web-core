import { For, Match, Switch } from "solid-js";
import {
  valueAt,
  withValue,
  type FieldDescriptor,
} from "@web-core/generators/fields";
import { Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import { itemBinding, useTree, type FieldBinding } from "../../lib/index.js";
import { Box } from "../kit/index.js";
import { Leaf } from "./leaf.jsx";

export function Node(props: {
  fields: readonly FieldDescriptor[];
  binding: FieldBinding;
}) {
  return (
    <Flow data-variant="column-center">
      <For each={props.fields}>
        {(field) => {
          const binding: FieldBinding = {
            value: () => valueAt(props.binding.value(), field.path),
            onChange: (value) =>
              props.binding.onChange(
                withValue(props.binding.value(), field.path, value),
              ),
          };

          const { add, elementFields, items, indices, removeAt } = useTree(
            field,
            binding,
          );

          return (
            <FlowItem style={layoutSelf({ align: "stretch" })}>
              <Switch fallback={<Leaf field={field} binding={binding} />}>
                <Match when={field.kind === "list"}>
                  <Box
                    label={field.label}
                    onAdd={add}
                    indices={indices()}
                    itemLabel={(index) => `${field.label} #${index + 1}`}
                    onRemove={removeAt}
                  >
                    {(index) => (
                      <Node
                        fields={elementFields()}
                        binding={itemBinding(binding, items, index)}
                      />
                    )}
                  </Box>
                </Match>
              </Switch>
            </FlowItem>
          );
        }}
      </For>
    </Flow>
  );
}
