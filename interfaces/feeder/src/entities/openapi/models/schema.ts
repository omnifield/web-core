import { z } from "@web-core/io";

import { HTTP_METHODS, type EndpointDescriptor, type HttpMethod } from "./types.js";

const paramSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean"]),
  required: z.boolean(),
});

export const endpointDescriptorSchema: z.ZodType = z.object({
  method: z.enum(HTTP_METHODS as [HttpMethod, ...HttpMethod[]]),
  url: z.string(),
  params: z.array(paramSchema),
});

export const manualGroupSchema: z.ZodType = z.object({ endpoints: z.array(endpointDescriptorSchema) });

export interface ManualGroupValue {
  readonly endpoints: readonly EndpointDescriptor[];
}
