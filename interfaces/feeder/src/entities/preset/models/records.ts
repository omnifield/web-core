import { presetsStore } from "./store";
import type { Preset } from "./types";

export interface Record<T> {
  readonly preset: Preset;
  readonly content: T;
}

export function recordsOf<T>(kind: string, as: (content: unknown) => T | undefined): Record<T>[] {
  const found: Record<T>[] = [];

  for (const preset of presetsStore.selectors.presetsOf(kind)) {
    const content = as(preset.content);
    if (content !== undefined) found.push({ preset, content });
  }

  return found;
}
