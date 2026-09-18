import type { z } from "@web-core/io";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const HTTP_METHODS: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export interface OpenapiEndpoint {
  readonly method: HttpMethod;
  readonly url: string;
  readonly tag?: string;
  readonly schema: z.ZodType;
}

export interface EndpointParam {
  readonly name: string;
  readonly type: "string" | "number" | "boolean";
  readonly required: boolean;
}

export interface EndpointDescriptor {
  readonly method: HttpMethod;
  readonly url: string;
  readonly params: readonly EndpointParam[];
}
