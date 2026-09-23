import { createGraphQLClient } from "@web-core/query/graphql";

import { PRESET_KIND, type ContentState, type PresetKind, type PresetKindState, type Tag } from "./kinds.js";
import type { PresetHeader, PresetRecord } from "./record.js";
import { CREATE_MUTATION, DELETE_MUTATION, HEADS_QUERY, LIST_QUERY, REPLACE_MUTATION } from "./queries.js";
import { text, toHeader, toRecord } from "./convert.js";
import { wire } from "./errors.js";
import type { WirePreset } from "./wire-preset.js";

export { PRESET_KIND };
export type { ContentState, PresetHeader, PresetKind, PresetRecord, Tag };

export interface PresetsClient {
  list<K extends PresetKind>(
    kind: K,
    options?: { readonly component?: readonly string[] },
  ): Promise<readonly PresetRecord<PresetKindState[K]>[]>;

  get<K extends PresetKind>(kind: K, name: string): Promise<PresetRecord<PresetKindState[K]> | undefined>;

  save<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>>;

  replace<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>>;

  remove(kind: PresetKind, name: string): Promise<void>;
}

export interface PresetsCatalog extends PresetsClient {
  listHeaders(
    kind: PresetKind,
    options?: { readonly component?: readonly string[] },
  ): Promise<readonly PresetHeader[]>;
}

export interface PresetsClientOptions {
  readonly url: string;
}

interface PresetFilter {
  readonly component?: readonly string[];
  readonly name?: readonly string[];
}

interface ListResponse {
  presets: readonly WirePreset[];
}

interface MutateResponse {
  id?: unknown;
  kind?: unknown;
  savedAt?: unknown;
}

export function createPresetsClient(options: PresetsClientOptions): PresetsCatalog {
  const client = createGraphQLClient({ url: options.url });

  async function ask(document: string, kind: PresetKind, filter?: PresetFilter): Promise<WirePreset[]> {
    const body = await wire(() =>
      client.request<ListResponse>(document, { kind, component: filter?.component, name: filter?.name }),
    );
    return body.presets.filter((item) => text(item.name) !== "" && text(item.id) !== "");
  }

  async function wireList(kind: PresetKind, filter?: PresetFilter): Promise<WirePreset[]> {
    return ask(LIST_QUERY, kind, filter);
  }

  async function wireHeads(kind: PresetKind, filter?: PresetFilter): Promise<WirePreset[]> {
    return ask(HEADS_QUERY, kind, filter);
  }

  async function named(kind: PresetKind, name: string): Promise<WirePreset | undefined> {
    return (await wireHeads(kind, { name: [name] })).find((candidate) => text(candidate.name) === name);
  }

  async function list<K extends PresetKind>(
    kind: K,
    options?: { readonly component?: readonly string[] },
  ): Promise<readonly PresetRecord<PresetKindState[K]>[]> {
    return (await wireList(kind, { component: options?.component })).map((item) => toRecord(kind, item));
  }

  async function listHeaders(
    kind: PresetKind,
    options?: { readonly component?: readonly string[] },
  ): Promise<readonly PresetHeader[]> {
    return (await wireHeads(kind, { component: options?.component })).map(toHeader);
  }

  async function get<K extends PresetKind>(
    kind: K,
    name: string,
  ): Promise<PresetRecord<PresetKindState[K]> | undefined> {
    const item = (await wireList(kind, { name: [name] })).find((candidate) => text(candidate.name) === name);
    return item === undefined ? undefined : toRecord(kind, item);
  }

  async function save<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>> {
    const body = await wire(() =>
      client.request<{ createPreset: MutateResponse }>(CREATE_MUTATION, {
        input: { kind, label: label ?? name, name, state },
      }),
    );

    return {
      id: text(body.createPreset.id),
      label: label ?? name,
      name,
      kind: text(body.createPreset.kind) as PresetKind,
      savedAt: text(body.createPreset.savedAt),
      state,
    };
  }

  async function replace<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>> {
    const existing = await named(kind, name);
    if (existing === undefined) return save(kind, name, state, label);

    const body = await wire(() =>
      client.request<{ replacePreset: MutateResponse }>(REPLACE_MUTATION, {
        id: text(existing.id),
        input: { kind, label: label ?? name, name, state },
      }),
    );

    return {
      id: text(body.replacePreset.id),
      label: label ?? name,
      name,
      kind: text(body.replacePreset.kind) as PresetKind,
      savedAt: text(body.replacePreset.savedAt),
      state,
    };
  }

  async function remove(kind: PresetKind, name: string): Promise<void> {
    const existing = await named(kind, name);
    if (existing === undefined) return;

    await wire(() => client.request<{ deletePreset: boolean }>(DELETE_MUTATION, { id: text(existing.id) }));
  }

  return { list, listHeaders, get, save, replace, remove };
}
