// Левел 2 — дашборд из нескольких ячеек сетки.

import salesDashboard from "./sales-dashboard.json";
import trafficDashboard from "./traffic-dashboard.json";

export const LEVEL2_TEMPLATES = [
  {
    value: "sales-dashboard",
    label: "Дашборд продаж",
    composition: salesDashboard,
  },
  {
    value: "traffic-dashboard",
    label: "Дашборд трафика",
    composition: trafficDashboard,
  },
];
