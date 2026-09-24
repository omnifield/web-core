import { DIAGRAM_DATA_RECORDS } from "./data/diagrams";
import { TABLE_DATA_RECORDS } from "./data/tables";

export { DIAGRAM_DATA_RECORDS } from "./data/diagrams";
export { TABLE_DATA_RECORDS } from "./data/tables";

/** Одна запись склада: имя, которым её адресует байндинг модуля, ярлык и сама секция
 *  (у таблицы `data` + `columns`, у диаграммы `data` + `series`). */
export interface ModuleDataRecord {
  readonly name: string;
  readonly label: string;
  readonly section: unknown;
}

export const MODULE_DATA_RECORDS: readonly ModuleDataRecord[] = [
  ...DIAGRAM_DATA_RECORDS,
  ...TABLE_DATA_RECORDS,
];

/** Все секции разом, ключ — имя записи: этим кормится модуль, его байндинги адресуют секцию. */
export const MODULE_DATA: Readonly<Record<string, unknown>> = Object.fromEntries(
  MODULE_DATA_RECORDS.map((record) => [record.name, record.section]),
);
