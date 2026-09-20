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
  Endpoints,
  type EndpointDescriptor,
  type SchemaDocument,
} from "../../../../entities/openapi";
import { Presets, recordsOf } from "../../../../entities/preset";
import { API_USER } from "../../lib";
import type { Serving } from "../../lib";
import { Endpoint } from "../endpoint";

export interface ApiProbeResult {
  readonly presetId: string;
  readonly endpoint: EndpointDescriptor;
  readonly serving: Serving;
}

const NOTHING = "Ручек, связанных с этим потребителем, нет";

function narrow(document: SchemaDocument, keep: ReadonlySet<string>): SchemaDocument {
  const endpoints = document.endpoints.filter((endpoint) => keep.has(endpoint.id));
  const groups = document.groups.filter((group) =>
    endpoints.some((endpoint) => endpoint.groupId === group.id),
  );

  return { endpoints, groups, defs: document.defs };
}

export function ApiProbe(props: {
  consumer: UserPath;
  onServing?: (event: ApiProbeResult) => void;
}) {
  const linked = createMemo(() => {
    const adapters = recordsOf(ADAPTER_KIND, asAdapter).map((one) => one.content);
    const paths = partnersOf(adapters, "consumers", props.consumer);

    const byPreset = new Map<string, Set<string>>();
    for (const [kind, presetId, endpointId] of paths) {
      if (kind !== API_USER.kind || presetId === undefined || endpointId === undefined) continue;

      const known = byPreset.get(presetId) ?? new Set<string>();
      known.add(endpointId);
      byPreset.set(presetId, known);
    }

    return byPreset;
  });

  return (
    <Show when={linked().size > 0} fallback={<Typography>{NOTHING}</Typography>}>
      <Presets
        kind={API_KIND}
        as={asSchemaDocument}
        empty={NOTHING}
        broken="Пресет не похож на схему API"
      >
      {(preset, document) => {
        const keep = () => linked().get(preset().id);
        const narrowed = () => narrow(document(), keep() ?? new Set());

        return (
          <Show when={narrowed().endpoints.length > 0}>
            <Endpoints label={preset().name} document={narrowed()}>
              {(endpoint) => (
                <Endpoint
                  endpoint={endpoint()}
                  defs={document().defs}
                  users={{
                    provider: API_USER.path(preset().id, endpoint().id),
                    consumer: props.consumer,
                  }}
                  onServing={(serving) =>
                    props.onServing?.({
                      presetId: preset().id,
                      endpoint: endpoint(),
                      serving,
                    })
                  }
                />
              )}
            </Endpoints>
          </Show>
        );
      }}
      </Presets>
    </Show>
  );
}
