import type { Preset } from "../models/types";
import type { PresetShape } from "./shape";

export function presetOf(record: Readonly<Record<string, unknown>>, shape: PresetShape): Preset {
  const content: Record<string, unknown> = {};

  for (const field of shape.fields) {
    const value = record[field];
    if (value !== null && value !== undefined) content[field] = value;
  }

  return {
    id: String(record.id),
    kind: shape.kind,
    label: String(record.label ?? ""),
    ...(typeof record.name === "string" ? { name: record.name } : {}),
    ...(typeof record.savedAt === "string" ? { savedAt: record.savedAt } : {}),
    content,
  };
}
