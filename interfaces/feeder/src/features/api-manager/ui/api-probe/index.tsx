import { createMemo, Show } from "@web-core/solid";
import { Typography } from "@web-core/ui";

import {
  asAdapter,
  ADAPTER_KIND,
  partnersOf,
  type UserPath,
} from "../../../../entities/adapter";
import {
  API_KIND,
  asSchemaDocument,
  endpointLabel,
  type EndpointDescriptor,
  type SchemaNode,
} from "../../../../entities/openapi";
import { recordsOf } from "../../../../entities/preset";
import { Box } from "../../../../shared";
import { API_USER } from "../../lib";
import type { Serving } from "../../lib";
import { Endpoint } from "../endpoint";

export interface ApiProbeResult {
  readonly presetId: string;
  readonly endpoint: EndpointDescriptor;
  readonly serving: Serving;
}

interface Linked {
  readonly presetId: string;
  readonly endpoint: EndpointDescriptor;
  readonly defs: Readonly<Record<string, SchemaNode>>;
}

const NOTHING = "Ручек, связанных с этим потребителем, нет";

export function ApiProbe(props: {
  consumer: UserPath;
  onServing?: (event: ApiProbeResult) => void;
}) {
  const linked = createMemo<Linked[]>(() => {
    const adapters = recordsOf(ADAPTER_KIND, asAdapter).map((one) => one.content);
    const paths = partnersOf(adapters, "consumers", props.consumer);

    const wanted = new Map<string, Set<string>>();
    for (const [kind, presetId, endpointId] of paths) {
      if (kind !== API_USER.kind || presetId === undefined || endpointId === undefined) continue;

      const known = wanted.get(presetId) ?? new Set<string>();
      known.add(endpointId);
      wanted.set(presetId, known);
    }

    const found: Linked[] = [];

    for (const { preset, content } of recordsOf(API_KIND, asSchemaDocument)) {
      const keep = wanted.get(preset.id);
      if (keep === undefined) continue;

      for (const endpoint of content.endpoints) {
        if (!keep.has(endpoint.id)) continue;

        found.push({ presetId: preset.id, endpoint, defs: content.defs });
      }
    }

    return found;
  });

  return (
    <Show when={linked().length > 0} fallback={<Typography>{NOTHING}</Typography>}>
      <Box
        items={linked()}
        itemKey={(one) => one.endpoint.id}
        itemLabel={(one) => endpointLabel(one.endpoint)}
      >
        {(one) => (
          <Endpoint
            endpoint={one().endpoint}
            defs={one().defs}
            users={{
              provider: API_USER.path(one().presetId, one().endpoint.id),
              consumer: props.consumer,
            }}
            onServing={(serving) =>
              props.onServing?.({
                presetId: one().presetId,
                endpoint: one().endpoint,
                serving,
              })
            }
          />
        )}
      </Box>
    </Show>
  );
}
