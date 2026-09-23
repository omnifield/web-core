import { existsSync } from "node:fs";
import { dirname, join, parse } from "node:path";

// Скрипт зовут из своей папки, а `pnpm -r` и его сводка работают от корня воркспейса —
// разбор в README.md, «Цена сценария».
export function workspaceRoot(from: string): string {
  let cursor = from;

  while (!existsSync(join(cursor, "pnpm-workspace.yaml"))) {
    const up = dirname(cursor);
    if (up === cursor || up === parse(cursor).root) return from;
    cursor = up;
  }

  return cursor;
}
