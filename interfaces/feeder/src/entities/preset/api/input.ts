import type { Preset } from "../models/types";

export interface PresetInput {
  readonly id: string;
  readonly kind: string;
  readonly label: string;
  readonly name?: string;
  readonly state: unknown;
}

export function inputOf(preset: Preset): PresetInput {
  return {
    id: preset.id,
    kind: preset.kind,
    label: preset.label,
    ...(preset.name === undefined ? {} : { name: preset.name }),
    state: preset.content,
  };
}
