import type { z } from "@web-core/io";

import type { SchemaNode } from "./json-schema";

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export const PARAM_IN = ["query", "path", "body"] as const;

export type ParamIn = (typeof PARAM_IN)[number];

export interface EndpointParam {
  readonly name: string;
  readonly in: ParamIn;
  readonly required: boolean;
  readonly schema: SchemaNode;
}

export interface Group {
  readonly id: string;
  readonly name: string;
}

export interface EndpointDescriptor {
  readonly id: string;
  readonly name?: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly groupId: string;
  readonly params: readonly EndpointParam[];
}

export interface SchemaDocument {
  readonly endpoints: readonly EndpointDescriptor[];
  readonly groups: readonly Group[];
  readonly defs: Readonly<Record<string, SchemaNode>>;
}

export interface IncomingEndpoint {
  readonly name?: string;
  readonly method: HttpMethod;
  readonly url: string;
  readonly tag?: string;
  readonly params: readonly EndpointParam[];
}

export interface IncomingDocument {
  readonly endpoints: readonly IncomingEndpoint[];
  readonly defs: Readonly<Record<string, SchemaNode>>;
}

export interface OpenapiEndpoint {
  readonly method: HttpMethod;
  readonly url: string;
  readonly schema: z.ZodType;
}
