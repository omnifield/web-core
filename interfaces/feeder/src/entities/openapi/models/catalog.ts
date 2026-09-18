import { run } from "@web-core/generators/mapping";
import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";

import { descriptorToEndpoint } from "./descriptor.js";
import { endpointKey } from "./key.js";
import { swagger2Template } from "./swagger/2.0/index.js";
import type { EndpointDescriptor, OpenapiEndpoint } from "./types.js";

export type ApiStatus = "idle" | "loading" | "ready" | "failed";

export interface ApiCatalogState {
  readonly raw?: string;
  readonly endpoints: readonly OpenapiEndpoint[];
  readonly status: ApiStatus;
  readonly error?: string;
}

export const apiCatalogOf = createActionStoreFamily<
  ApiCatalogState,
  {
    loadSchema(raw: string): Promise<void>;
    addEndpoint(descriptor: EndpointDescriptor): void;
    removeEndpoint(id: string): void;
  },
  string
>(
  { endpoints: [], status: "idle" },
  ({ setState, get }) => ({
    async loadSchema(raw) {
      setState(
        mutate<ApiCatalogState>((draft) => {
          draft.raw = raw;
          draft.status = "loading";
          draft.error = undefined;
        }),
      );

      try {
        const endpoints = await run(raw, [swagger2Template]);
        if (get().raw !== raw) return;

        setState(
          mutate<ApiCatalogState>((draft) => {
            draft.endpoints = castDraft(endpoints);
            draft.status = "ready";
          }),
        );
      } catch (error) {
        if (get().raw !== raw) return;

        setState(
          mutate<ApiCatalogState>((draft) => {
            draft.endpoints = [];
            draft.status = "failed";
            draft.error = error instanceof Error ? error.message : String(error);
          }),
        );
      }
    },
    addEndpoint(descriptor) {
      const endpoint = descriptorToEndpoint(descriptor);
      setState(
        mutate<ApiCatalogState>((draft) => {
          const id = endpointKey(endpoint);
          const at = draft.endpoints.findIndex((item) => endpointKey(item) === id);
          if (at === -1) draft.endpoints.push(castDraft(endpoint));
          else draft.endpoints[at] = castDraft(endpoint);
          draft.status = "ready";
        }),
      );
    },
    removeEndpoint(id) {
      setState(
        mutate<ApiCatalogState>((draft) => {
          draft.endpoints = draft.endpoints.filter((item) => endpointKey(item) !== id);
        }),
      );
    },
  }),
);

export function endpointBy(state: ApiCatalogState, id: string): OpenapiEndpoint | undefined {
  return state.endpoints.find((endpoint) => endpointKey(endpoint) === id);
}
