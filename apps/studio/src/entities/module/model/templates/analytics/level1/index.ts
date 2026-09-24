// Левел 1 — модуль из одного компонента: заголовок и одна диаграмма.

import errorsReport from "./errors-report.json";

export const LEVEL1_TEMPLATES = [
  {
    value: "errors-report",
    label: "Ошибки по службам",
    composition: errorsReport,
  },
];
