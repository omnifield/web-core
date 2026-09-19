import { createSignal } from "@web-core/solid";

import {
  addEndpoint,
  addGroup,
  API_KIND,
  asSchemaDocument,
  Endpoints,
  removeEndpoint,
  removeGroup,
  type EndpointDescriptor,
  type EndpointGroup,
  type InvokeResult,
  type SchemaDocument,
} from "../../../../entities/openapi";
import { Presets, presetsStore } from "../../../../entities/preset";
import { Endpoint } from "../endpoint";
import { ConfigDialog } from "./config-dialog";

export interface ApiCatalogResult {
  readonly presetId: string;
  readonly endpoint: EndpointDescriptor;
  readonly result: InvokeResult;
}

export function ApiCatalog(props: {
  onResult?: (event: ApiCatalogResult) => void;
}) {
  const [config, setConfig] =
    createSignal<SchemaDocument | EndpointGroup | EndpointDescriptor>();

  return (
    <>
      <Presets
        kind={API_KIND}
        as={asSchemaDocument}
        empty="Схем пока нет — загрузите документ"
        broken="Пресет не похож на схему API"
      >
        {(preset, document, edit) => (
          <Endpoints
            label={preset().name}
            document={document()}
            onAddGroup={() => edit((draft) => addGroup(draft))}
            onAddEndpoint={(group) =>
              edit((draft) => addEndpoint(draft, group.id))
            }
            onConfig={(item) => setConfig(() => item)}
            onRemove={() => presetsStore.actions.remove(preset().id)}
            onRemoveGroup={(group) =>
              edit((draft) => removeGroup(draft, group.id))
            }
            onRemoveEndpoint={(endpoint) =>
              edit((draft) => removeEndpoint(draft, endpoint.id))
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

      <ConfigDialog item={config()} onClose={() => setConfig(undefined)} />
    </>
  );
}
