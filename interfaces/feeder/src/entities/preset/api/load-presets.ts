import { gql } from "@web-core/query/graphql";

import type { Preset } from "../models/types";
import { presetOf } from "./envelope";
import { presetsService } from "./service";
import type { PresetShape } from "./shape";

function documentOf(type: string, fields: readonly string[]): string {
  return gql`
    query Presets($kind: String, $name: [String!]) {
      presets(kind: $kind, name: $name) {
        id
        label
        name
        kind
        savedAt
        ... on ${type} {
          ${fields.join("\n          ")}
        }
      }
    }
  `;
}

export async function loadPresets(
  shape: PresetShape,
  names?: readonly string[],
): Promise<Preset[]> {
  const answer = await presetsService().request<{
    presets: Record<string, unknown>[];
  }>(documentOf(shape.type, shape.fields), {
    kind: shape.kind,
    ...(names === undefined ? {} : { name: names }),
  });

  return answer.presets.map((record) => presetOf(record, shape));
}
