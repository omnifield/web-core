import {
  API_KIND,
  asSchemaDocument,
  Endpoints,
} from "../../../../entities/openapi";
import { Presets } from "../../../../entities/preset";
import { Endpoint } from "../endpoint";
import type { ApiCatalogResult } from "../api-catalog";

export function ApiProbe(props: { onResult?: (event: ApiCatalogResult) => void }) {
  return (
    <Presets
      kind={API_KIND}
      as={asSchemaDocument}
      empty="Схем пока нет — загрузите документ"
      broken="Пресет не похож на схему API"
    >
      {(preset, document) => (
        <Endpoints label={preset().name} document={document()}>
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
  );
}
