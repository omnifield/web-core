import {
  assign,
  collectFieldRuleReport,
  collectRowsReport,
  pointerOf,
  segmentsOf,
  type FieldRef,
  type FieldRule,
  type FieldRuleIssue,
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

interface RowRule {
  /** Куда кладём: список в форме потребителя (часть цели до индекса). */
  readonly list: FieldRef;
  /** Откуда берём набор, если корень не задан на записи: часть источника до индекса. */
  readonly root: FieldRef | undefined;
  /** Правило: и цель, и источник уже относительно ОДНОЙ записи набора. */
  readonly rule: FieldRule;
}

function splitOf(path: FieldRef): { head: FieldRef; tail: FieldRef } | undefined {
  const segments = segmentsOf(path);
  const at = segments.findIndex((segment) => /^\d+$/.test(segment));
  if (at === -1) return undefined;

  return { head: pointerOf(segments.slice(0, at)), tail: pointerOf(segments.slice(at + 1)) };
}

function rowRule(rule: AdapterRule): RowRule | undefined {
  const target = splitOf(rule.target);
  if (target === undefined) return undefined;

  const source = rule.from === undefined ? undefined : splitOf(rule.from);

  return {
    list: target.head,
    root: source?.head,
    rule: { ...rule, target: target.tail, from: source?.tail ?? rule.from },
  };
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

function strayIssue(rule: RowRule, taken: FieldRef): FieldRuleIssue {
  return {
    target: rule.rule.target,
    reason:
      `связь берёт записи из «${rule.root ?? ""}», а набор собирается из «${taken}» — ` +
      "в одной записи адаптера набор один, и это поле осталось незаполненным",
    count: 1,
    examples: [],
  };
}

export function feed(response: unknown, adapter: Adapter): FeedResult {
  const rows: RowRule[] = [];
  const flat: FieldRule[] = [];

  for (const rule of adapter.rules) {
    const row = rowRule(rule);
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

  // Корень задан на записи — берётся он; пуст — его называет сама связь: человек показал набор
  // мышью, и путь источника несёт его слева от индекса (разбор — FAQ.md).
  const root = adapter.root === "" ? (rows[0]?.root ?? "") : adapter.root;

  const stray = rows.filter((row) => row.root !== undefined && row.root !== root);
  const lists = new Map<FieldRef, FieldRule[]>();

  for (const row of rows) {
    if (stray.includes(row)) continue;

    const group = lists.get(row.list) ?? [];
    group.push(row.rule);
    lists.set(row.list, group);
  }

  let report: FieldRuleReport = {
    ...single.report,
    issues: [...single.report.issues, ...stray.map((row) => strayIssue(row, root))],
  };
  let error: string | null = null;

  for (const [list, group] of lists) {
    const collected = collectRowsReport(response, root, group, adapter.extra);

    assign(value, list, collected.rows);
    report = merge(report, collected.report);
    error ??= collected.error;
  }

  return { value, report, error };
}
