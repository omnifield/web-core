import {
  describeSample,
  describeSchema,
  discoverRowSets,
  lookup,
  z,
  type FieldRef,
  type PathType,
} from "@web-core/io";

export function isSchema(value: unknown): value is z.ZodType {
  return value instanceof z.ZodType;
}

export function describeVariant(value: unknown, depth = 6): PathType[] {
  return isSchema(value) ? describeSchema(value, depth) : describeSample(value, depth);
}

export function rowSetsOf(source: unknown): FieldRef[] {
  return isSchema(source) ? [] : discoverRowSets(source);
}

export function recordPathsOf(source: unknown, root: FieldRef): PathType[] {
  if (isSchema(source)) return describeSchema(source);

  const found = lookup(source, root);
  if (!found.found) return [];

  const record = Array.isArray(found.value) ? found.value[0] : found.value;
  if (typeof record !== "object" || record === null) return [];

  return describeSample(record);
}
