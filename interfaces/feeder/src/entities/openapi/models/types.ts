import type { z } from "@web-core/io";

import type { SchemaNode } from "./json-schema";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const HTTP_METHODS: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export type ParamIn = "query" | "path" | "body";

export interface EndpointParam {
  readonly name: string;
  readonly in: ParamIn;
  readonly required: boolean;
  readonly schema: SchemaNode;
}

export interface EndpointDescriptor {
  readonly method: HttpMethod;
  readonly url: string;
  readonly tag?: string;
  readonly params: readonly EndpointParam[];
}

export interface SchemaDocument {
  readonly endpoints: readonly EndpointDescriptor[];
  readonly defs: Readonly<Record<string, SchemaNode>>;
}

export interface OpenapiEndpoint {
  readonly method: HttpMethod;
  readonly url: string;
  readonly tag?: string;
  readonly schema: z.ZodType;
}
