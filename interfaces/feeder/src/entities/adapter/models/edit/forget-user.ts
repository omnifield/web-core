import type { Draft } from "@web-core/store/mutate";

import type { Adapter } from "../types";
import { branch } from "./branch";
import type { UserRole } from "./role";

export function forgetUser(
  adapter: Draft<Adapter>,
  role: UserRole,
  path: readonly string[],
): void {
  if (path.length === 0) return;

  const leaf = path[path.length - 1]!;
  const parent = branch(adapter[role], path.slice(0, -1));

  delete parent[leaf];
}
