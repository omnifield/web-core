import type { createGraphQLClient } from "@web-core/query/graphql";

export type PresetsService = ReturnType<typeof createGraphQLClient>;

export const NOT_CONNECTED =
  "Склад не подключён к службе пресетов — позовите connectPresets(client)";

let connected: PresetsService | undefined;

export function connectPresets(service: PresetsService | undefined): void {
  connected = service;
}

export function presetsService(): PresetsService {
  if (connected === undefined) throw new Error(NOT_CONNECTED);
  return connected;
}
