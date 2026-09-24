import type { Adapter, AdapterRule, UserTree } from "./types";

function isRule(value: unknown): value is AdapterRule {
  if (typeof value !== "object" || value === null) return false;

  const rule = value as Partial<AdapterRule>;
  return typeof rule.id === "string" && typeof rule.target === "string";
}

function asTree(value: unknown): UserTree | undefined {
  if (value === undefined) return {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;

  return value as UserTree;
}

export function asAdapter(value: unknown): Adapter | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const record = value as Partial<Adapter>;
  if (typeof record.root !== "string") return undefined;
  if (!Array.isArray(record.rules) || !record.rules.every(isRule)) return undefined;

  const providers = asTree(record.providers);
  const consumers = asTree(record.consumers);
  if (providers === undefined || consumers === undefined) return undefined;

  return { root: record.root, rules: record.rules, extra: record.extra, providers, consumers };
}
