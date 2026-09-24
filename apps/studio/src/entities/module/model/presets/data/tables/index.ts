// Данные таблиц — снимок склада пресетов (вид `content`, компонент `table`), снят 2026-09-24.
// Почему выгрузка лежит файлами и чем это грозит — FAQ.md зоны.

import basic from "./basic.json";
import inventory from "./inventory.json";
import orders from "./orders.json";
import tableCars from "./table-cars.json";
import teamLarge from "./team-large.json";

export const TABLE_DATA_RECORDS = [
  {
    name: "basic",
    label: "Три строки — Аня/Борис/Вера",
    section: basic,
  },
  {
    name: "inventory",
    label: "Склад — цены и остатки, есть нулевой",
    section: inventory,
  },
  {
    name: "orders",
    label: "Заказы — вперемешку статусы и суммы",
    section: orders,
  },
  {
    name: "table-cars",
    label: "Таблица — автопарк",
    section: tableCars,
  },
  {
    name: "team-large",
    label: "Команда — 9 строк, для мультисортировки и пагинации",
    section: teamLarge,
  },
];
