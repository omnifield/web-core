import type { ExtraPolicy, FieldRef, FieldRule } from "@web-core/io";
import { createActionStoreFamily } from "@web-core/store";
import { castDraft, mutate } from "@web-core/store/mutate";

import { sourceKey, type Adapter, type FeedSource } from "./types";

export interface AdaptersState {
  readonly adapters: readonly Adapter[];
}

export const adapterStoreOf = createActionStoreFamily<
  AdaptersState,
  {
    bind(source: FeedSource): void;
    unbind(id: string): void;
    setRules(id: string, rules: readonly FieldRule[]): void;
    setRoot(id: string, root: FieldRef): void;
    setExtra(id: string, extra: ExtraPolicy): void;
    hydrate(adapters: readonly Adapter[]): void;
  },
  string
>({ adapters: [] }, ({ setState }) => ({
  bind(source) {
    setState(
      mutate<AdaptersState>((draft) => {
        const id = sourceKey(source);
        const at = draft.adapters.findIndex((adapter) => sourceKey(adapter.source) === id);
        if (at === -1) draft.adapters.push(castDraft({ source, root: "", rules: [] }));
        else draft.adapters[at].source = castDraft(source);
      }),
    );
  },
  unbind(id) {
    setState(
      mutate<AdaptersState>((draft) => {
        draft.adapters = draft.adapters.filter((adapter) => sourceKey(adapter.source) !== id);
      }),
    );
  },
  setRules(id, rules) {
    setState(
      mutate<AdaptersState>((draft) => {
        const adapter = draft.adapters.find((item) => sourceKey(item.source) === id);
        if (adapter !== undefined) adapter.rules = castDraft(rules);
      }),
    );
  },
  setRoot(id, root) {
    setState(
      mutate<AdaptersState>((draft) => {
        const adapter = draft.adapters.find((item) => sourceKey(item.source) === id);
        if (adapter !== undefined) adapter.root = root;
      }),
    );
  },
  setExtra(id, extra) {
    setState(
      mutate<AdaptersState>((draft) => {
        const adapter = draft.adapters.find((item) => sourceKey(item.source) === id);
        if (adapter !== undefined) adapter.extra = extra;
      }),
    );
  },
  hydrate(adapters) {
    setState(
      mutate<AdaptersState>((draft) => {
        draft.adapters = castDraft(adapters);
      }),
    );
  },
}));

export function adapterBy(state: AdaptersState, id: string): Adapter | undefined {
  return state.adapters.find((adapter) => sourceKey(adapter.source) === id);
}
