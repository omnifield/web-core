import type { FieldRef } from "@web-core/io";
import type { Draft } from "@web-core/store/mutate";

import type { Adapter } from "../types";

export function unlink(adapter: Draft<Adapter>, target: FieldRef): void {
  const at = adapter.rules.findIndex((rule) => rule.target === target);
  if (at !== -1) adapter.rules.splice(at, 1);
}
