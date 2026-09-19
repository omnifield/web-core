import type { EndpointDescriptor } from "../types";
import { paramTypeOf } from "./param-type";
import type { EndpointConfig } from "./types";

export function endpointConfigOf(endpoint: EndpointDescriptor): EndpointConfig {
  return {
    method: endpoint.method,
    url: endpoint.url,
    params: endpoint.params.map((param) => ({
      name: param.name,
      in: param.in,
      required: param.required,
      type: paramTypeOf(param.schema),
    })),
  };
}
