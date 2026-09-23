import type { Command } from "commander";

import { valueAt, type LoadedConfig } from "../settings/index";
import type { BoundOption } from "./build";

export interface ResolvedOptions {
  readonly values: Readonly<Record<string, unknown>>;
  /** Флаги, значение которых не дал ни один слой, а команда их требует. */
  readonly missing: readonly string[];
}

const FROM_USER = new Set(["cli", "env"]);

export function resolveOptions(
  target: Command,
  bound: readonly BoundOption[],
  config: LoadedConfig,
): ResolvedOptions {
  const supplied = target.opts();
  const values: Record<string, unknown> = {};
  const missing: string[] = [];

  for (const option of bound) {
    const source = target.getOptionValueSource(option.attribute);
    let value = supplied[option.attribute] as unknown;

    if (!FROM_USER.has(source ?? "") && option.declaration.config) {
      const stored = valueAt(config.data, option.declaration.config);
      if (stored !== undefined) value = parseStored(stored, option);
    }

    if (value === undefined && option.declaration.required) missing.push(option.declaration.flags);

    values[option.key] = value;
  }

  return { values, missing };
}

function parseStored(stored: unknown, option: BoundOption): unknown {
  const { parse } = option.declaration;
  return parse && typeof stored === "string" ? parse(stored, undefined) : stored;
}
