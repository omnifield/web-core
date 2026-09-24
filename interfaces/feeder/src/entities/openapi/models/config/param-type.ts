import type { SchemaNode } from "../json-schema";
import { PARAM_TYPES, type ParamType } from "./types";

export function paramTypeOf(schema: SchemaNode): ParamType {
  if (schema.$ref !== undefined) return "object";

  const known = PARAM_TYPES.find((type) => type === schema.type);
  return known ?? "string";
}
