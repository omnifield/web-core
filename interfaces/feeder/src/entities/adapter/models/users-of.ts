import type { UserRole } from "./edit";
import type { Adapter } from "./types";
import type { UserPath } from "./users";

export function usersOf(adapter: Adapter, role: UserRole): UserPath[] {
  const found: UserPath[] = [];

  const walk = (node: unknown, path: string[]): void => {
    if (typeof node !== "object" || node === null || Array.isArray(node)) return;

    const keys = Object.keys(node);
    if (keys.length === 0) {
      if (path.length > 0) found.push(path);
      return;
    }

    for (const key of keys) walk((node as Record<string, unknown>)[key], [...path, key]);
  };

  walk(adapter[role], []);

  return found;
}
