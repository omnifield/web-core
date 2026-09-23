import { execFileSync } from "node:child_process";

// Тулзу зовут из её папки (`pnpm --filter`), а синк работает с репозиторием целиком.
export function repoRoot(from: string): string {
  try {
    return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: from, encoding: "utf8" }).trim();
  } catch {
    return from;
  }
}
