import { Flow, FlowItem, Typography } from "@web-core/ui";
import { createSignal, Show } from "@web-core/solid";

import { API_KIND, parseSchema } from "../../../entities/openapi";
import { failureOf, PresetInfo, presetsStore, pushPreset } from "../../../entities/preset";
import { RawLoader } from "../../../shared/ui";

export function ExternalSchemaLoader() {
  const [label, setLabel] = createSignal("");
  const [failure, setFailure] = createSignal<string>();
  const [unsent, setUnsent] = createSignal<string>();

  const title = () => label().trim();

  async function save(raw: string) {
    setFailure(undefined);
    setUnsent(undefined);

    let id: string;

    try {
      id = presetsStore.actions.add(API_KIND, title(), await parseSchema(raw));
      setLabel("");
    } catch (error) {
      setFailure(error instanceof Error ? error.message : String(error));
      return;
    }

    try {
      await pushPreset(id);
    } catch (error) {
      setUnsent(failureOf(error).message);
    }
  }

  return (
    <Flow data-variant="column">
      <FlowItem>
        <PresetInfo label={label()} onLabel={setLabel} />
      </FlowItem>
      <FlowItem>
        <RawLoader
          label="Загрузить схему"
          accept=".json,.yaml,.yml,.txt"
          disabled={title() === ""}
          onLoad={(raw) => void save(raw)}
        />
      </FlowItem>
      <Show when={failure()}>
        {(message) => (
          <FlowItem>
            <Typography>Схема не распозналась: {message()}</Typography>
          </FlowItem>
        )}
      </Show>
      <Show when={unsent()}>
        {(message) => (
          <FlowItem>
            <Typography>Схема загружена, но в службу не уехала: {message()}</Typography>
          </FlowItem>
        )}
      </Show>
    </Flow>
  );
}
