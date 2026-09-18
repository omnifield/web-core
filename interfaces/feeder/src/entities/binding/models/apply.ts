import {
  collectFieldRuleReport,
  collectRowsReport,
  lookup,
  type FieldRuleReport,
  type RowsResult,
} from "@web-core/io";

import { isFed, type Binding } from "./types.js";

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

/** Еды нет и вот почему — та же форма результата, что у удачного применения: у того, кто кормит
 *  компонент, один тип ответа на все исходы, без развилки «результат или ошибка». */
export function noFeed(error: string): RowsResult {
  return { rows: [], report: EMPTY_REPORT, error };
}

/**
 * Применить привязку к ответу ручки — вся механика в `@web-core/io` (L3 `collectRowsReport` —
 * набор записей, L2 `collectFieldRuleReport` — одна запись), здесь только развилка «набор или
 * одна запись» и честный отказ вместо пустого результата.
 *
 * Развилка нужна потому, что привязывают не только списки: `GET /users` отдаёт массив, а
 * `GET /user/{id}` — один объект, и оба — законная еда (первый таблице, второй карточке). `io`
 * это разделение не делает за нас: `collectRowsReport` ждёт именно массив и на объекте отдаёт
 * ошибку, поэтому одну запись прогоняем L2 напрямую, тем же отчётом.
 */
export function applyBinding(response: unknown, binding: Binding): RowsResult {
  if (!isFed(binding)) return noFeed("привязка без адаптера: поля ещё не сведены");

  const found = lookup(response, binding.root);
  if (!found.found) {
    return noFeed(
      `в ответе нет пути «${binding.root}» — ручка отвечает не той формой, на которой настраивали адаптер`,
    );
  }

  if (Array.isArray(found.value)) {
    return collectRowsReport(response, binding.root, binding.rules, binding.extra);
  }

  if (isRecord(found.value)) {
    const { rows, report } = collectFieldRuleReport([found.value], binding.rules, binding.extra);
    return { rows, report, error: null };
  }

  return noFeed("по пути привязки лежит скаляр — записи из него не собрать");
}
