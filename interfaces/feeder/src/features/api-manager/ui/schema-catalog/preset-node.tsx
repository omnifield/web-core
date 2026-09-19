import { layoutSelf } from "@web-core/skin";
import type { Draft } from "@web-core/store/mutate";
import { FlowItem, Typography } from "@web-core/ui";
import { Show } from "@web-core/solid";

import {
  asSchemaDocument,
  endpointKey,
  Endpoints,
  removeEndpoint,
  removeTag,
  type SchemaDocument,
} from "../../../../entities/openapi";
import { presetsStore, type Preset } from "../../../../entities/preset";
import { EndpointCall } from "../endpoint-call";

export function PresetNode(props: { preset: Preset }) {
  const document = () => asSchemaDocument(props.preset.content);

  function edit(recipe: (draft: Draft<SchemaDocument>) => void) {
    presetsStore.actions.edit<SchemaDocument>(props.preset.id, recipe);
  }

  return (
    <FlowItem style={layoutSelf({ align: "stretch" })}>
      <Show
        when={document()}
        fallback={<Typography>Пресет не похож на схему API</Typography>}
      >
        {(found) => (
          <Endpoints
            label={props.preset.name}
            endpoints={found().endpoints}
            onRemove={() => presetsStore.actions.remove(props.preset.id)}
            onRemoveTag={(tag) => edit((draft) => removeTag(draft, tag))}
            onRemoveEndpoint={(endpoint) =>
              edit((draft) => removeEndpoint(draft, endpointKey(endpoint)))
            }
          >
            {(endpoint) => <EndpointCall endpoint={endpoint()} defs={found().defs} />}
          </Endpoints>
        )}
      </Show>
    </FlowItem>
  );
}
