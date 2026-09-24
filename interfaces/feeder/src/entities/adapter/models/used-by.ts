import type { Adapter } from "./types";
import type { UserRole } from "./edit";

export function usedBy(adapter: Adapter, role: UserRole, path: readonly string[]): boolean {
  if (path.length === 0) return false;

  let level: unknown = adapter[role];

  for (const step of path) {
    if (typeof level !== "object" || level === null || Array.isArray(level)) return false;

    const next = (level as Record<string, unknown>)[step];
    if (next === undefined) return false;

    level = next;
  }

  return true;
}
