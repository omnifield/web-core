import { createResource, createSignal, Show } from "@web-core/solid";
import { Typography } from "@web-core/ui";

import {
  addEndpoint,
  addGroup,
  API_KIND,
  API_SHAPE,
  asSchemaDocument,
  Endpoints,
  removeEndpoint,
  removeGroup,
  type EndpointDescriptor,
  type InvokeResult,
} from "../../../../entities/openapi";
import {
  dropPreset,
  failureOf,
  loadPresets,
  Presets,
  presetsStore,
  pushPreset,
} from "../../../../entities/preset";
import { Endpoint } from "../endpoint";
import { ConfigDialog, type ConfigSubject } from "./config-dialog";

export interface ApiCatalogResult {
  readonly presetId: string;
  readonly endpoint: EndpointDescriptor;
  readonly result: InvokeResult;
}

export function ApiCatalog(props: {
  onResult?: (event: ApiCatalogResult) => void;
}) {
  const [config, setConfig] = createSignal<ConfigSubject>();
  const [unsent, setUnsent] = createSignal<string>();

  const [pulled] = createResource(async () => {
    const stored = await loadPresets(API_SHAPE);
    presetsStore.actions.adopt(stored);
    return stored.length;
  });

  async function send(id: string): Promise<void> {
    try {
      await pushPreset(id);
      setUnsent(undefined);
    } catch (error) {
      setUnsent(failureOf(error).message);
    }
  }

  function write(id: string, change: () => void): void {
    change();
    void send(id);
  }

  async function forget(id: string, savedAt: string | undefined): Promise<void> {
    presetsStore.actions.remove(id);
    if (savedAt === undefined) return;

    try {
      await dropPreset(id);
      setUnsent(undefined);
    } catch (error) {
      setUnsent(failureOf(error).message);
    }
  }

  return (
    <>
      <Show when={pulled.loading}>
        <Typography>Читаем схемы из службы…</Typography>
      </Show>

      <Show when={pulled.error}>
        {(error) => (
          <Typography>Службу прочитать не вышло: {failureOf(error()).message}</Typography>
        )}
      </Show>

      <Show when={unsent()}>
        {(message) => <Typography>Правка в службу не уехала: {message()}</Typography>}
      </Show>

      <Presets
        kind={API_KIND}
        as={asSchemaDocument}
        empty="Схем пока нет — загрузите документ"
        broken="Пресет не похож на схему API"
      >
        {(preset, document, edit) => (
          <Endpoints
            label={preset().label}
            document={document()}
            onAddGroup={() =>
              write(preset().id, () => edit((draft) => addGroup(draft)))
            }
            onAddEndpoint={(group) =>
              write(preset().id, () => edit((draft) => addEndpoint(draft, group.id)))
            }
            onConfig={(target) => setConfig({ preset: preset(), target })}
            onRemove={() => void forget(preset().id, preset().savedAt)}
            onRemoveGroup={(group) =>
              write(preset().id, () => edit((draft) => removeGroup(draft, group.id)))
            }
            onRemoveEndpoint={(endpoint) =>
              write(preset().id, () => edit((draft) => removeEndpoint(draft, endpoint.id)))
            }
          >
            {(endpoint) => (
              <Endpoint
                endpoint={endpoint()}
                defs={document().defs}
                onResult={(result) =>
                  props.onResult?.({
                    presetId: preset().id,
                    endpoint: endpoint(),
                    result,
                  })
                }
              />
            )}
          </Endpoints>
        )}
      </Presets>

      <ConfigDialog
        subject={config()}
        onClose={() => setConfig(undefined)}
        onWritten={(presetId) => void send(presetId)}
      />
    </>
  );
}
