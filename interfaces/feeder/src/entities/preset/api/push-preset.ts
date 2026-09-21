import { presetsStore } from "../models/store";
import type { Preset } from "../models/types";
import { savePreset } from "./save-preset";

export async function pushPreset(id: string): Promise<Preset> {
  const preset = presetsStore.selectors.presetBy(id);
  if (preset === undefined) throw new Error(`Записи «${id}» на складе нет — отправлять нечего`);

  const saved = await savePreset(preset);
  presetsStore.actions.markSaved(id, saved.savedAt);

  return saved;
}
