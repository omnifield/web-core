import { z } from "@web-core/io";

import type { EndpointGroup } from "../group";
import {
  HTTP_METHODS,
  PARAM_IN,
  type EndpointDescriptor,
  type SchemaDocument,
} from "../types";

export const PARAM_TYPES = [
  "string",
  "number",
  "integer",
  "boolean",
  "object",
  "array",
] as const;

export type ParamType = (typeof PARAM_TYPES)[number];

export const GROUP_CONFIG = z.object({ name: z.string() });

export type GroupConfig = z.infer<typeof GROUP_CONFIG>;

export const ENDPOINT_CONFIG = z.object({
  method: z.enum(HTTP_METHODS),
  url: z.string(),
  params: z.array(
    z.object({
      name: z.string(),
      in: z.enum(PARAM_IN),
      required: z.boolean(),
      type: z.enum(PARAM_TYPES),
    }),
  ),
});

export type EndpointConfig = z.infer<typeof ENDPOINT_CONFIG>;

export type ConfigTarget =
  | { readonly kind: "schema"; readonly item: SchemaDocument }
  | { readonly kind: "group"; readonly item: EndpointGroup }
  | { readonly kind: "endpoint"; readonly item: EndpointDescriptor };
