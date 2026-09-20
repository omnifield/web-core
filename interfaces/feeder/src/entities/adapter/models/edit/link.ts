import type { FieldRef } from "@web-core/io";
import type { Draft } from "@web-core/store/mutate";

import type { Adapter } from "../types";

export function link(adapter: Draft<Adapter>, target: FieldRef, from: FieldRef): string {
  const found = adapter.rules.find((rule) => rule.target === target);
  if (found !== undefined) {
    found.from = from;
    return found.id;
  }

  const id = crypto.randomUUID();
  adapter.rules.push({ id, target, from });

  return id;
}
