import { z } from "@web-core/io";

import { schemaNodeToZod, type SchemaNode } from "./json-schema";
import type { EndpointDescriptor, OpenapiEndpoint } from "./types";

export function endpointOf(
  descriptor: EndpointDescriptor,
  defs: Readonly<Record<string, SchemaNode>> = {},
): OpenapiEndpoint {
  const shape: Record<string, z.ZodType> = {};

  for (const param of descriptor.params) {
    const key = param.in === "body" ? "body" : param.name;
    const value = schemaNodeToZod(param.schema, defs);
    shape[key] = param.required ? value : value.optional();
  }

  return {
    method: descriptor.method,
    url: descriptor.url,
    tag: descriptor.tag,
    schema: z.object(shape),
  };
}
