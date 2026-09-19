import { createActionStore } from "@web-core/store";
import { castDraft, mutate, type Draft } from "@web-core/store/mutate";

import type { Preset } from "./types";

export interface PresetsState {
  readonly presets: readonly Preset[];
}

export const presetsStore = createActionStore<
  PresetsState,
  {
    add(name: string, content: unknown): string;
    remove(id: string): void;
    rename(id: string, name: string): void;
    replace(id: string, content: unknown): void;
    edit<T>(id: string, recipe: (content: Draft<T>) => void): void;
    hydrate(presets: readonly Preset[]): void;
  },
  { presetBy(state: PresetsState, id: string): Preset | undefined }
>(
  { presets: [] },
  ({ setState }) => ({
    add(name, content) {
      const id = crypto.randomUUID();
      setState(
        mutate<PresetsState>((draft) => {
          draft.presets.push(castDraft({ id, name, content }));
        }),
      );
      return id;
    },
    remove(id) {
      setState(
        mutate<PresetsState>((draft) => {
          draft.presets = draft.presets.filter((preset) => preset.id !== id);
        }),
      );
    },
    rename(id, name) {
      setState(
        mutate<PresetsState>((draft) => {
          const preset = draft.presets.find((item) => item.id === id);
          if (preset !== undefined) preset.name = name;
        }),
      );
    },
    replace(id, content) {
      setState(
        mutate<PresetsState>((draft) => {
          const preset = draft.presets.find((item) => item.id === id);
          if (preset !== undefined) preset.content = castDraft(content);
        }),
      );
    },
    edit(id, recipe) {
      setState(
        mutate<PresetsState>((draft) => {
          const preset = draft.presets.find((item) => item.id === id);
          if (preset !== undefined) recipe(preset.content as Draft<never>);
        }),
      );
    },
    hydrate(presets) {
      setState(
        mutate<PresetsState>((draft) => {
          draft.presets = castDraft(presets);
        }),
      );
    },
  }),
  () => ({
    presetBy(state, id) {
      return state.presets.find((preset) => preset.id === id);
    },
  }),
);
