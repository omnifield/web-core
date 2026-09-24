import { layoutSelf } from "@web-core/skin";
import { Button, Field, FieldInput, Flow, FlowItem, Typography } from "@web-core/ui";
import { Show } from "@web-core/solid";

export function PresetSaving(props: {
  name: string;
  onName: (name: string) => void;
  onSave: () => void;
  disabled?: boolean;
  note?: string;
}) {
  return (
    <Flow data-variant="column">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Flow>
          <FlowItem style={layoutSelf({ grow: true })}>
            <Field>
              <FieldInput
                style={{ "min-width": "0", width: "100%" }}
                placeholder="Имя записи для ссылок"
                value={props.name}
                onInput={(event) => props.onName(event.currentTarget.value)}
              />
            </Field>
          </FlowItem>
          <FlowItem>
            <Button disabled={props.disabled} onClick={() => props.onSave()}>
              Сохранить
            </Button>
          </FlowItem>
        </Flow>
      </FlowItem>

      <Show when={props.note}>
        {(note) => (
          <FlowItem>
            <Typography>{note()}</Typography>
          </FlowItem>
        )}
      </Show>
    </Flow>
  );
}
