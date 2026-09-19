import { layoutSelf } from "@web-core/skin";
import { Key } from "@web-core/solid/keyed";
import type { Draft } from "@web-core/store/mutate";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import { Show } from "@web-core/solid";

import {
  addEndpoint,
  addGroup,
  asSchemaDocument,
  Endpoints,
  removeEndpoint,
  removeGroup,
  type EndpointDescriptor,
  type InvokeResult,
  type SchemaDocument,
} from "../../../../entities/openapi";
import { presetsStore } from "../../../../entities/preset";
import { Endpoint } from "../endpoint";

export interface ApiCatalogResult {
  readonly presetId: string;
  readonly endpoint: EndpointDescriptor;
  readonly result: InvokeResult;
}

export function ApiCatalog(props: {
  onResult?: (event: ApiCatalogResult) => void;
}) {
  const state = presetsStore.use();

  return (
    <Flow data-variant="column">
      <Show
        when={state().presets.length > 0}
        fallback={<Typography>Схем пока нет — загрузите документ</Typography>}
      >
        <Key each={state().presets} by="id">
          {(preset) => {
            const document = () => asSchemaDocument(preset().content);

            function edit(recipe: (draft: Draft<SchemaDocument>) => void) {
              presetsStore.actions.edit<SchemaDocument>(preset().id, recipe);
            }

            return (
              <FlowItem style={layoutSelf({ align: "stretch" })}>
                <Show
                  when={document()}
                  fallback={<Typography>Пресет не похож на схему API</Typography>}
                >
                  {(found) => (
                    <Endpoints
                      label={preset().name}
                      document={found()}
                      onAddGroup={() => edit((draft) => addGroup(draft))}
                      onAddEndpoint={(group) => edit((draft) => addEndpoint(draft, group.id))}
                      onRemove={() => presetsStore.actions.remove(preset().id)}
                      onRemoveGroup={(group) => edit((draft) => removeGroup(draft, group.id))}
                      onRemoveEndpoint={(endpoint) =>
                        edit((draft) => removeEndpoint(draft, endpoint.id))
                      }
                    >
                      {(endpoint) => (
                        <Endpoint
                          endpoint={endpoint()}
                          defs={found().defs}
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
                </Show>
              </FlowItem>
            );
          }}
        </Key>
      </Show>
    </Flow>
  );
}
