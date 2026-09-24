import type { ExtraPolicy, FieldRef, FieldRule } from "@web-core/io";

export interface AdapterRule extends FieldRule {
  readonly id: string;
}

export type UserTree = Readonly<Record<string, unknown>>;

export interface Adapter {
  readonly root: FieldRef;
  readonly rules: readonly AdapterRule[];
  readonly extra?: ExtraPolicy;
  readonly providers: UserTree;
  readonly consumers: UserTree;
}

export function isFed(adapter: Adapter): boolean {
  return adapter.rules.length > 0;
}
