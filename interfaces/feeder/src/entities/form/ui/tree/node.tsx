import { For, Match, Switch } from "@web-core/solid";
import {
  valueAt,
  withValue,
  type FieldDescriptor,
} from "@web-core/generators/fields";
import { Flow, FlowItem } from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";

import { itemBinding, useTree, type FieldBinding } from "../../lib";
import { Box } from "../../../../shared/ui";
import { Leaf } from "./leaf";

export function FieldNode(props: {
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
                    onAddChild={add}
                    items={indices()}
                    itemKey={(index) => String(index)}
                    itemLabel={(index) => `${field.label} #${index + 1}`}
                    onItemRemove={removeAt}
                  >
                    {(index) => (
                      <FieldNode
                        fields={elementFields}
                        binding={itemBinding(binding, items, index())}
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
