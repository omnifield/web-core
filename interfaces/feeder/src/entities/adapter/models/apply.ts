import {
  collectFieldRuleReport,
  collectRowsReport,
  lookup,
  type FieldRuleReport,
  type RowsResult,
} from "@web-core/io";

import { isFed, type Adapter } from "./types";

const EMPTY_REPORT: FieldRuleReport = {
  total: 0,
  converted: 0,
  rejected: 0,
  issues: [],
  unmapped: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function noFeed(error: string): RowsResult {
  return { rows: [], report: EMPTY_REPORT, error };
}

export function applyAdapter(response: unknown, adapter: Adapter): RowsResult {
  if (!isFed(adapter)) return noFeed("привязка без адаптера: поля ещё не сведены");

  const found = lookup(response, adapter.root);
  if (!found.found) {
    return noFeed(
      `в ответе нет пути «${adapter.root}» — ручка отвечает не той формой, на которой настраивали адаптер`,
    );
  }

  if (Array.isArray(found.value)) {
    return collectRowsReport(response, adapter.root, adapter.rules, adapter.extra);
  }

  if (isRecord(found.value)) {
    const { rows, report } = collectFieldRuleReport([found.value], adapter.rules, adapter.extra);
    return { rows, report, error: null };
  }

  return noFeed("по пути привязки лежит скаляр — записи из него не собрать");
}
