import { FeedManual } from "#/features/feed/manual";
import { FeedOpenapi } from "#/features/feed/openapi";
import { FeedPreset } from "#/features/feed/preset";
import type { RailSection } from "#/widgets/rail";

/**
 * Секции поставщиков еды, по одной на поставщика.
 *
 * Место сбора: каждый поставщик — сам себе фича и про соседей не знает, а порядок и вид секций
 * решаются здесь. Новый поставщик добавляется строкой в списке и строкой импорта — ни доска
 * (`entities/feed`), ни показ, ни соседние секции при этом не меняются.
 *
 * Отдаётся списком, а не готовой панелью: в рейле рядом стоят секции не про кормление (показ),
 * и один аккордеон на них всех собирается страницей.
 */
export function feedSections(): RailSection[] {
  return [
    {
      value: "preset",
      label: "Пресет",
      children: <FeedPreset />,
    },
    {
      value: "openapi",
      label: "Ручка API",
      children: <FeedOpenapi />,
    },
    {
      value: "manual",
      label: "Ручной ввод",
      open: true,
      children: <FeedManual />,
    },
  ];
}
