import { defineUserKind } from "../../../entities/adapter";

export const API_USER = defineUserKind(
  "api",
  (presetId: string, endpointId: string) => [presetId, endpointId],
);
