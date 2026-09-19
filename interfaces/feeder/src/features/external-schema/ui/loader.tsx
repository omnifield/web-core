import { Flow, FlowItem, Typography } from "@web-core/ui";
import { createSignal, Show } from "@web-core/solid";

import { parseSchema } from "../../../entities/openapi";
import { PresetInfo, PresetLoader, presetsStore } from "../../../entities/preset";

export function ExternalSchemaLoader() {
  const [name, setName] = createSignal("");
  const [failure, setFailure] = createSignal<string>();

  const title = () => name().trim();

  async function save(raw: string) {
    setFailure(undefined);

    try {
      presetsStore.actions.add(title(), await parseSchema(raw));
      setName("");
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <Flow data-variant="column">
      <FlowItem>
        <PresetInfo name={name()} onName={setName} />
      </FlowItem>
      <FlowItem>
        <PresetLoader disabled={title() === ""} onLoad={(raw) => void save(raw)} />
      </FlowItem>
      <Show when={failure()}>
        {(message) => (
          <FlowItem>
            <Typography>Схема не распозналась: {message()}</Typography>
          </FlowItem>
        )}
      </Show>
    </Flow>
  );
}
