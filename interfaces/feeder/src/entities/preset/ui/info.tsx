import { layoutSelf } from "@web-core/skin";
import { Field, FieldInput, Flow, FlowItem } from "@web-core/ui";

export function PresetInfo(props: { name: string; onName: (name: string) => void }) {
  return (
    <Flow data-variant="column">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Field>
          <FieldInput
            style={{ "min-width": "0", width: "100%" }}
            placeholder="Название пресета"
            value={props.name}
            onInput={(event) => props.onName(event.currentTarget.value)}
          />
        </Field>
      </FlowItem>
    </Flow>
  );
}
