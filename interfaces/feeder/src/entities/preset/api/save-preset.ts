import { gql } from "@web-core/query/graphql";

import type { Preset } from "../models/types";
import { inputOf } from "./input";
import { presetsService } from "./service";

const CREATE = gql`
  mutation CreatePreset($input: PresetInput!) {
    createPreset(input: $input) {
      id
      savedAt
    }
  }
`;

const REPLACE = gql`
  mutation ReplacePreset($id: ID!, $input: PresetInput!) {
    replacePreset(id: $id, input: $input) {
      id
      savedAt
    }
  }
`;

const SILENT = "Служба приняла запись, но не назвала, когда сохранила";

export async function savePreset(preset: Preset): Promise<Preset & { savedAt: string }> {
  const input = inputOf(preset);
  const fresh = preset.savedAt === undefined;

  const answer = await presetsService().request<
    Record<string, { id: string; savedAt: string } | undefined>
  >(fresh ? CREATE : REPLACE, fresh ? { input } : { id: preset.id, input });

  const saved = fresh ? answer.createPreset : answer.replacePreset;
  if (saved === undefined) throw new Error(SILENT);

  return { ...preset, savedAt: saved.savedAt };
}
