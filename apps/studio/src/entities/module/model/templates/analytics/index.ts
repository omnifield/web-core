// Аналитика — дашборды из диаграмм и таблиц. Каждый левел это своя группа каталога и своя
// папка со спеками; почему спека данными, а не кодом — FAQ.md зоны.

import { LEVEL1_TEMPLATES } from "./level1";
import { LEVEL2_TEMPLATES } from "./level2";

export const ANALYTICS_LEVELS = [
  {
    value: "level1",
    label: "Левел 1",
    templates: LEVEL1_TEMPLATES,
  },
  {
    value: "level2",
    label: "Левел 2",
    templates: LEVEL2_TEMPLATES,
  },
];
