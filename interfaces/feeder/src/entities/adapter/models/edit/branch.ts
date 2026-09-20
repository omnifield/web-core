import type { Draft } from "@web-core/store/mutate";

import type { UserTree } from "../types";

export function branch(
  tree: Draft<UserTree>,
  path: readonly string[],
): Record<string, unknown> {
  let level = tree as Record<string, unknown>;

  for (const step of path) {
    const inner = level[step];
    const next =
      typeof inner === "object" && inner !== null && !Array.isArray(inner)
        ? (inner as Record<string, unknown>)
        : {};

    level[step] = next;
    level = next;
  }

  return level;
}
