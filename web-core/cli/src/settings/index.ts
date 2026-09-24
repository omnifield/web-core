import { cosmiconfig } from "cosmiconfig";

export interface LoadedConfig {
  readonly data: Readonly<Record<string, unknown>>;
  readonly path?: string;
}

export interface LoadConfigOptions {
  /** Явный путь к файлу — флаг `--config` тулзы или переменная окружения. */
  readonly path?: string;
  readonly cwd?: string;
}

const EMPTY: LoadedConfig = { data: {} };

export async function loadConfig(name: string, options: LoadConfigOptions = {}): Promise<LoadedConfig> {
  const explorer = cosmiconfig(name, { searchStrategy: "global" });
  const found = options.path
    ? await explorer.load(options.path)
    : await explorer.search(options.cwd ?? process.cwd());

  if (!found || found.isEmpty || !isRecord(found.config)) return EMPTY;

  return { data: found.config, path: found.filepath };
}

export function valueAt(data: Readonly<Record<string, unknown>>, path: string): unknown {
  let cursor: unknown = data;

  for (const step of path.split(".")) {
    if (!isRecord(cursor)) return undefined;
    cursor = cursor[step];
  }

  return cursor;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
