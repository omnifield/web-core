import type { PresetKind } from "./kinds.js";

export interface PresetHeader {
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly kind: PresetKind;
  readonly savedAt: string;
}

export interface PresetRecord<T> extends PresetHeader {
  readonly state: T;
}
