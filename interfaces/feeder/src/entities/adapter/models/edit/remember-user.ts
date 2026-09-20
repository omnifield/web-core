import type { Draft } from "@web-core/store/mutate";

import type { Adapter } from "../types";
import { branch } from "./branch";
import type { UserRole } from "./role";

export function rememberUser(
  adapter: Draft<Adapter>,
  role: UserRole,
  path: readonly string[],
): void {
  if (path.length === 0) return;

  branch(adapter[role], path);
}
