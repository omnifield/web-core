import { z } from "@web-core/io";

export interface SchemaNode {
  readonly $ref?: string;
  readonly type?: string;
  readonly properties?: Readonly<Record<string, SchemaNode>>;
  readonly required?: readonly string[];
  readonly items?: SchemaNode;
  readonly enum?: readonly unknown[];
}

function resolve(
  node: SchemaNode,
  definitions: Readonly<Record<string, SchemaNode>>,
  cache: Map<string, z.ZodType>,
  inProgress: ReadonlySet<string>,
): z.ZodType {
  if (node.$ref !== undefined) {
    const name = node.$ref.replace(/^#\/definitions\//, "");
    const target = definitions[name];
    if (!target) return z.unknown();

    const cached = cache.get(name);
    if (cached) return cached;
    if (inProgress.has(name)) return z.lazy(() => cache.get(name) ?? z.unknown());

    const result = resolve(target, definitions, cache, new Set([...inProgress, name]));
    cache.set(name, result);
    return result;
  }

  if (node.enum !== undefined && node.enum.length > 0 && node.enum.every((value) => typeof value === "string")) {
    return z.enum(node.enum as [string, ...string[]]);
  }

  switch (node.type) {
    case "object": {
      const required = new Set(node.required ?? []);
      const shape: Record<string, z.ZodType> = {};
      for (const [key, propNode] of Object.entries(node.properties ?? {})) {
        const propSchema = resolve(propNode, definitions, cache, inProgress);
        shape[key] = required.has(key) ? propSchema : propSchema.optional();
      }
      return z.object(shape);
    }
    case "array":
      return z.array(node.items ? resolve(node.items, definitions, cache, inProgress) : z.unknown());
    case "integer":
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    case "string":
      return z.string();
    default:
      return z.unknown();
  }
}

export function schemaNodeToZod(node: SchemaNode, definitions: Readonly<Record<string, SchemaNode>>): z.ZodType {
  return resolve(node, definitions, new Map(), new Set());
}
