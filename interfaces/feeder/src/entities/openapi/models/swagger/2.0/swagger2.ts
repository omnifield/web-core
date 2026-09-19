import type { MappingTemplate } from "@web-core/generators/mapping";
import { parse } from "yaml";

import type { SchemaNode } from "../../json-schema";
import {
  HTTP_METHODS,
  type EndpointDescriptor,
  type EndpointParam,
  type HttpMethod,
  type ParamIn,
  type SchemaDocument,
} from "../../types";

interface Swagger2Parameter {
  readonly name: string;
  readonly in: "query" | "path" | "header" | "body" | "formData";
  readonly required?: boolean;
  readonly type?: string;
  readonly items?: SchemaNode;
  readonly enum?: readonly unknown[];
  readonly schema?: SchemaNode;
}

interface Swagger2Operation {
  readonly tags?: readonly string[];
  readonly parameters?: readonly Swagger2Parameter[];
}

interface Swagger2Document {
  readonly swagger?: string;
  readonly host?: string;
  readonly basePath?: string;
  readonly schemes?: readonly string[];
  readonly paths?: Readonly<Record<string, Readonly<Record<string, Swagger2Operation>>>>;
  readonly definitions?: Readonly<Record<string, SchemaNode>>;
}

function parseSwagger2(raw: string): Swagger2Document | undefined {
  try {
    const doc: unknown = parse(raw);
    return typeof doc === "object" && doc !== null && (doc as Swagger2Document).swagger === "2.0"
      ? (doc as Swagger2Document)
      : undefined;
  } catch {
    return undefined;
  }
}

function baseUrlOf(doc: Swagger2Document): string {
  const scheme = doc.schemes?.[0] ?? "https";
  return `${scheme}://${doc.host ?? ""}${doc.basePath ?? ""}`;
}

function nodeOf(param: Swagger2Parameter): SchemaNode {
  if (param.schema !== undefined) return param.schema;
  if (param.enum !== undefined && param.enum.length > 0) return { type: param.type ?? "string", enum: param.enum };
  if (param.type === "array") return { type: "array", items: param.items ?? {} };
  return { type: param.type ?? "string" };
}

function paramsOf(operation: Swagger2Operation): readonly EndpointParam[] {
  const params: EndpointParam[] = [];

  for (const param of operation.parameters ?? []) {
    if (param.in === "header" || param.in === "formData") continue;

    params.push({
      name: param.name,
      in: param.in as ParamIn,
      required: param.required === true,
      schema: nodeOf(param),
    });
  }

  return params;
}

function documentOf(doc: Swagger2Document): SchemaDocument {
  const baseUrl = baseUrlOf(doc);
  const endpoints: EndpointDescriptor[] = [];

  for (const [path, operations] of Object.entries(doc.paths ?? {})) {
    for (const [method, operation] of Object.entries(operations)) {
      const upperMethod = method.toUpperCase();
      if (!HTTP_METHODS.includes(upperMethod as HttpMethod)) continue;

      endpoints.push({
        method: upperMethod as HttpMethod,
        url: `${baseUrl}${path}`,
        tag: operation.tags?.[0],
        params: paramsOf(operation),
      });
    }
  }

  return { endpoints, defs: doc.definitions ?? {} };
}

export const swagger2Template: MappingTemplate<SchemaDocument, SchemaDocument> = {
  name: "swagger-2.0",

  isEntry: (raw) => parseSwagger2(raw) !== undefined,

  collect: (raw) => {
    const doc = parseSwagger2(raw);
    return doc === undefined ? [] : [documentOf(doc)];
  },

  validate: (items) => {
    if (items[0] === undefined || items[0].endpoints.length === 0) {
      throw new Error("swagger-2.0: в paths не нашлось ни одной операции с поддерживаемым методом");
    }
  },

  render: (items) => items[0] ?? { endpoints: [], defs: {} },
};
