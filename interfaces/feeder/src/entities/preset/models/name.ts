import { z } from "@web-core/io";

import { presetsStore } from "./store";
import type { Preset } from "./types";

export const PRESET_NAME = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{0,31}$/,
    "Строчная латиница, цифры и дефис, до 32 знаков, первый знак — не дефис",
  );

export function presetNamed(kind: string, name: string): Preset | undefined {
  return presetsStore.selectors.presetsOf(kind).find((preset) => preset.name === name);
}
