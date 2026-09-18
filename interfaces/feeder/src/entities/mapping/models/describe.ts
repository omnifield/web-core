import {
  describeSample,
  describeSchema,
  discoverRowSets,
  lookup,
  z,
  type FieldRef,
  type PathType,
} from "@web-core/io";

/** Вариант — либо сырые данные (сэмпл ответа), либо зод-схема; различаются по `instanceof`, а не
 *  по флагу снаружи: заставлять вызывающего объявлять то, что видно по самому значению, значит
 *  заводить второй источник правды. */
export function isSchema(value: unknown): value is z.ZodType {
  return value instanceof z.ZodType;
}

/** Скалярные листья варианта, в одной форме независимо от происхождения. */
export function describeVariant(value: unknown, depth = 6): PathType[] {
  return isSchema(value) ? describeSchema(value, depth) : describeSample(value, depth);
}

/** Места в ответе, похожие на набор записей, — кандидаты для `root` привязки. Выбирает человек:
 *  заворачивают все по-разному (`/data/items`, `/result`, вовсе без обёртки), и угадывать за него
 *  `io` отказывается осознанно. У схемы кандидатов нет — сэмпла, в котором их искать, ещё нет. */
export function rowSetsOf(source: unknown): FieldRef[] {
  return isSchema(source) ? [] : discoverRowSets(source);
}

/**
 * Поля ОДНОЙ записи источника — то, из чего собираются `FieldRule`.
 *
 * Ключевая деталь: правила пишутся на запись, а не на ответ целиком, поэтому и пути надо
 * показывать записи, а не ответа. Для массива это первый элемент (`/data/items/0/name` в самом
 * ответе — это `/name` в записи), для одиночного объекта — он сам.
 */
export function recordPathsOf(source: unknown, root: FieldRef): PathType[] {
  if (isSchema(source)) return describeSchema(source);

  const found = lookup(source, root);
  if (!found.found) return [];

  const record = Array.isArray(found.value) ? found.value[0] : found.value;
  if (typeof record !== "object" || record === null) return [];

  return describeSample(record);
}
