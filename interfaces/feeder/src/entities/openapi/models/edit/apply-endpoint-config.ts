import type { Draft } from "@web-core/store/mutate";

import { paramTypeOf, type EndpointConfig } from "../config";
import type { SchemaDocument } from "../types";

export function applyEndpointConfig(
  document: Draft<SchemaDocument>,
  endpointId: string,
  config: EndpointConfig,
): void {
  const endpoint = document.endpoints.find((one) => one.id === endpointId);
  if (endpoint === undefined) return;

  const described = new Map(
    endpoint.params.map((param) => [param.name, param.schema] as const),
  );

  endpoint.method = config.method;
  endpoint.url = config.url;
  endpoint.params = config.params.map((param) => {
    const known = described.get(param.name);

    return {
      name: param.name,
      in: param.in,
      required: param.required,
      schema:
        known !== undefined && paramTypeOf(known) === param.type
          ? known
          : { type: param.type },
    };
  });
}
