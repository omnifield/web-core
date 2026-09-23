import { loadConfig, valueAt } from "@web-core/cli";

export interface Target {
  readonly name: string;
  readonly url: string;
  readonly branch: string;
  readonly source: string;
  readonly include: readonly string[];
  readonly ignore: readonly string[];
  /** Маски файлов, которые не уезжают даже из включённых путей. */
  readonly exclude: readonly string[];
  /** Путь, чей префикс снимается при раскладке: его содержимое ложится в КОРЕНЬ цели. */
  readonly strip: string;
}

export interface Targets {
  readonly path?: string;
  readonly list: readonly Target[];
}

export async function readTargets(cwd: string, file: string): Promise<Targets> {
  const loaded = await loadConfig("sync", { path: `${cwd}/${file}` });
  const list: Target[] = [];

  for (const [name, raw] of Object.entries(loaded.data)) {
    if (!isRecord(raw)) continue;

    list.push({
      name,
      url: text(valueAt(raw, "url")),
      branch: text(valueAt(raw, "branch")) || "main",
      source: text(valueAt(raw, "source")),
      include: strings(valueAt(raw, "include")),
      ignore: strings(valueAt(raw, "ignore")),
      exclude: strings(valueAt(raw, "exclude")),
      strip: text(valueAt(raw, "strip")),
    });
  }

  return { ...(loaded.path ? { path: loaded.path } : {}), list };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strings(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
