import { layoutGroup } from "@web-core/skin";
import { Flow, FlowItem } from "@web-core/ui";
import { FeedManual } from "#/features/feed/manual";
import { FeedOpenapi } from "#/features/feed/openapi";
import { FeedPreset } from "#/features/feed/preset";

/** Черта между поставщиками — временно стилем по месту: отдельной линии в ките пока нет, и она
 *  туда собирается (решение user 2026-09-21). `currentColor` работает в обеих темах. */
const line = { "border-block-start": "1px solid currentColor", opacity: "0.2" };

/**
 * Панель кормления: поставщики еды один под другим, разделённые чертой.
 *
 * Место сбора: каждый поставщик — сам себе фича и про соседей не знает, а порядок и вид решаются
 * здесь. Новый поставщик добавляется строкой и строкой импорта — ни доска (`entities/feed`), ни
 * показ при этом не меняются.
 *
 * Отдаётся готовым блоком, а не списком секций: секция — понятие рейла, и форму её записи виджету
 * кормления взять неоткуда, сосед по слою ему не виден.
 */
export function FeedPanel() {
  return (
    <Flow data-variant="column" style={layoutGroup({ gap: "space-2" })}>
      <FlowItem>
        <FeedPreset />
      </FlowItem>
      <FlowItem style={line} />
      <FlowItem>
        <FeedOpenapi />
      </FlowItem>
      <FlowItem style={line} />
      <FlowItem>
        <FeedManual />
      </FlowItem>
    </Flow>
  );
}
