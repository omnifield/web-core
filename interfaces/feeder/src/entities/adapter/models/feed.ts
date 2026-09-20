import {
  assign,
  collectFieldRuleReport,
  collectRowsReport,
  pointerOf,
  segmentsOf,
  type FieldRef,
  type FieldRule,
  type FieldRuleReport,
} from "@web-core/io";

import type { Adapter, AdapterRule } from "./types";

export interface FeedResult {
  readonly value: unknown;
  readonly report: FieldRuleReport;
  readonly error: string | null;
}

const EMPTY_REPORT: FieldRuleReport = {
  total: 0,
  converted: 0,
  rejected: 0,
  issues: [],
  unmapped: [],
};

interface RowTarget {
  readonly list: FieldRef;
  readonly rule: FieldRule;
}

function listOf(target: FieldRef): { list: FieldRef; tail: FieldRef } | undefined {
  const path = segmentsOf(target);
  const at = path.findIndex((segment) => /^\d+$/.test(segment));
  if (at === -1) return undefined;

  return { list: pointerOf(path.slice(0, at)), tail: pointerOf(path.slice(at + 1)) };
}

function rowTarget(rule: AdapterRule): RowTarget | undefined {
  const split = listOf(rule.target);
  if (split === undefined) return undefined;

  return { list: split.list, rule: { ...rule, target: split.tail } };
}

function merge(one: FieldRuleReport, two: FieldRuleReport): FieldRuleReport {
  return {
    total: one.total + two.total,
    converted: one.converted + two.converted,
    rejected: one.rejected + two.rejected,
    issues: [...one.issues, ...two.issues],
    unmapped: [...one.unmapped, ...two.unmapped],
  };
}

export function feed(response: unknown, adapter: Adapter): FeedResult {
  const rows: RowTarget[] = [];
  const flat: FieldRule[] = [];

  for (const rule of adapter.rules) {
    const row = rowTarget(rule);
    if (row === undefined) flat.push(rule);
    else rows.push(row);
  }

  const value: Record<string, unknown> = {};

  const single =
    flat.length === 0
      ? { rows: [], report: EMPTY_REPORT }
      : collectFieldRuleReport(
          [
            (typeof response === "object" && response !== null
              ? response
              : {}) as Record<string, unknown>,
          ],
          flat,
          "drop",
        );

  Object.assign(value, single.rows[0] ?? {});

  if (rows.length === 0) return { value, report: single.report, error: null };

  const lists = new Map<FieldRef, FieldRule[]>();
  for (const row of rows) {
    const group = lists.get(row.list) ?? [];
    group.push(row.rule);
    lists.set(row.list, group);
  }

  let report = single.report;
  let error: string | null = null;

  for (const [list, group] of lists) {
    const collected = collectRowsReport(response, adapter.root, group, adapter.extra);

    assign(value, list, collected.rows);
    report = merge(report, collected.report);
    error ??= collected.error;
  }

  return { value, report, error };
}
