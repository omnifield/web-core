import type { EntryCheck } from "./contract";

export interface ProbeRecord {
  readonly entry: string;
  readonly ok: boolean;
  readonly phase: "resolve" | "exists" | "import";
  readonly checkedBy: EntryCheck;
  readonly resolved?: string;
  readonly durationMs: number;
  readonly code?: string;
  readonly kind?: string;
  readonly message?: string;
  readonly stack?: string;
}

/** Раннер едет исходником, а не файлом поставки: файл пришлось бы вносить в `files`, а это тот же класс ошибок, который проба и ловит. */
export function runnerScript(entries: readonly string[]): string {
  return `import { statSync } from "node:fs";
import { basename } from "node:path";
import { fileURLToPath } from "node:url";

const ENTRIES = ${JSON.stringify(entries)};
const MODULES = new Set([".js", ".mjs", ".cjs", ".node"]);

for (const entry of ENTRIES) {
  const started = performance.now();
  const record = { entry, phase: "resolve", checkedBy: "import" };

  try {
    record.resolved = import.meta.resolve(entry);
    record.phase = "exists";

    const file = record.resolved.startsWith("file:") ? fileURLToPath(record.resolved) : "";
    if (file) statSync(file);

    const name = basename(file);
    const dot = name.lastIndexOf(".");
    const extension = dot > 0 ? name.slice(dot) : "";

    record.phase = "import";
    if (extension === ".json") {
      record.checkedBy = "json-import";
      await import(entry, { with: { type: "json" } });
    } else if (extension === "" || MODULES.has(extension)) {
      await import(entry);
    } else {
      record.checkedBy = "file";
    }
    record.ok = true;
  } catch (error) {
    record.ok = false;
    record.code = error?.code;
    record.kind = error?.constructor?.name;
    record.message = String(error?.message ?? error);
    record.stack = String(error?.stack ?? "");
  }

  record.durationMs = Math.round(performance.now() - started);
  console.log(JSON.stringify(record));
}
`;
}

/** Строки раннера читаются по одной: оборвался процесс — видно, на каком подпути. */
export function parseRecords(output: string): readonly ProbeRecord[] {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("{") && line.endsWith("}"))
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as ProbeRecord];
      } catch {
        return [];
      }
    });
}
