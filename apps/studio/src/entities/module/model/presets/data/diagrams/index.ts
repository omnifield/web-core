// Данные диаграмм — снимок склада пресетов (вид `content`, компонент `diagram`), снят 2026-09-24.
// Почему выгрузка лежит файлами и чем это грозит — FAQ.md зоны.

import diagramBrowserShare from "./diagram-browser-share.json";
import diagramBudgetPlanFact from "./diagram-budget-plan-fact.json";
import diagramCommitsByDay from "./diagram-commits-by-day.json";
import diagramConversionRate from "./diagram-conversion-rate.json";
import diagramCpuLoad from "./diagram-cpu-load.json";
import diagramDeployDuration from "./diagram-deploy-duration.json";
import diagramErrorsByService from "./diagram-errors-by-service.json";
import diagramFunnelSteps from "./diagram-funnel-steps.json";
import diagramNpsBreakdown from "./diagram-nps-breakdown.json";
import diagramQuarterRevenue from "./diagram-quarter-revenue.json";
import diagramResponseTime from "./diagram-response-time.json";
import diagramSalesByRegion from "./diagram-sales-by-region.json";
import diagramStorageByType from "./diagram-storage-by-type.json";
import diagramTeamLoad from "./diagram-team-load.json";
import diagramTicketStatus from "./diagram-ticket-status.json";
import diagramUsersChurn from "./diagram-users-churn.json";
import diagramVisitorsByHour from "./diagram-visitors-by-hour.json";
import diagramWeekTemperature from "./diagram-week-temperature.json";

export const DIAGRAM_DATA_RECORDS = [
  {
    name: "diagram-browser-share",
    label: "Диаграмма — доли браузеров",
    section: diagramBrowserShare,
  },
  {
    name: "diagram-budget-plan-fact",
    label: "Диаграмма — план и факт по кварталам",
    section: diagramBudgetPlanFact,
  },
  {
    name: "diagram-commits-by-day",
    label: "Диаграмма — коммиты за месяц",
    section: diagramCommitsByDay,
  },
  {
    name: "diagram-conversion-rate",
    label: "Диаграмма — конверсия по месяцам",
    section: diagramConversionRate,
  },
  {
    name: "diagram-cpu-load",
    label: "Диаграмма — загрузка процессора за сутки",
    section: diagramCpuLoad,
  },
  {
    name: "diagram-deploy-duration",
    label: "Диаграмма — длительность выкаток",
    section: diagramDeployDuration,
  },
  {
    name: "diagram-errors-by-service",
    label: "Диаграмма — ошибки по службам",
    section: diagramErrorsByService,
  },
  {
    name: "diagram-funnel-steps",
    label: "Диаграмма — воронка регистрации",
    section: diagramFunnelSteps,
  },
  {
    name: "diagram-nps-breakdown",
    label: "Диаграмма — NPS по группам",
    section: diagramNpsBreakdown,
  },
  {
    name: "diagram-quarter-revenue",
    label: "Диаграмма — выручка по месяцам",
    section: diagramQuarterRevenue,
  },
  {
    name: "diagram-response-time",
    label: "Диаграмма — время ответа против нагрузки",
    section: diagramResponseTime,
  },
  {
    name: "diagram-sales-by-region",
    label: "Диаграмма — продажи по регионам",
    section: diagramSalesByRegion,
  },
  {
    name: "diagram-storage-by-type",
    label: "Диаграмма — диск по типам файлов",
    section: diagramStorageByType,
  },
  {
    name: "diagram-team-load",
    label: "Диаграмма — загрузка команды",
    section: diagramTeamLoad,
  },
  {
    name: "diagram-ticket-status",
    label: "Диаграмма — заявки по статусам",
    section: diagramTicketStatus,
  },
  {
    name: "diagram-users-churn",
    label: "Диаграмма — пришли и ушли по неделям",
    section: diagramUsersChurn,
  },
  {
    name: "diagram-visitors-by-hour",
    label: "Диаграмма — посетители по часам",
    section: diagramVisitorsByHour,
  },
  {
    name: "diagram-week-temperature",
    label: "Диаграмма — температура по дням недели",
    section: diagramWeekTemperature,
  },
];
