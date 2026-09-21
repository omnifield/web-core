import { gql } from "@web-core/query/graphql";

import { presetsService } from "./service";

const DELETE = gql`
  mutation DeletePreset($id: ID!) {
    deletePreset(id: $id)
  }
`;

export async function dropPreset(id: string): Promise<boolean> {
  const answer = await presetsService().request<{ deletePreset: boolean }>(DELETE, { id });

  return answer.deletePreset;
}
