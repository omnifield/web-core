import type { ExtraPolicy, FieldRef, FieldRule } from "@web-core/io";

export interface FeedSource {
  readonly apiId: string;
  readonly endpointId: string;
  readonly value?: unknown;
}

export interface Adapter {
  readonly source: FeedSource;
  readonly root: FieldRef;
  readonly rules: readonly FieldRule[];
  readonly extra?: ExtraPolicy;
}

export interface Consumer {
  readonly name: string;
  readonly input: unknown;
}

export function sourceKey(source: FeedSource): string {
  return `${source.apiId} ${source.endpointId}`;
}

export function isFed(adapter: Adapter): boolean {
  return adapter.rules.length > 0;
}
