import { z } from "@web-core/io";

import type { Preset } from "./types";

export const PRESET_CONFIG = z.object({ label: z.string() });

export type PresetConfig = z.infer<typeof PRESET_CONFIG>;

export function presetConfigOf(preset: Preset): PresetConfig {
  return { label: preset.label };
}
