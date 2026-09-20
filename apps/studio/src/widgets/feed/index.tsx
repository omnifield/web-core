import {
  Accordion,
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
} from "@web-core/ui";
import { FeedManual } from "#/features/feed/manual";
import { FeedOpenapi } from "#/features/feed/openapi";
import { FeedPreset } from "#/features/feed/preset";

/**
 * Панели поставщиков еды, по одной секции на поставщика.
 *
 * Место сбора: каждый поставщик — сам себе фича и про соседей не знает, а порядок и вид секций
 * решаются здесь. Новый поставщик добавляется секцией и строкой импорта — ни доска
 * (`entities/feed`), ни показ, ни соседние панели при этом не меняются.
 *
 * Секции независимы (`multiple`): открытая запись и открытая форма рядом — обычный случай,
 * человек смотрит, что правит.
 */
export function FeedPanel() {
  return (
    <Accordion multiple defaultValue={["preset"]}>
      <AccordionItem value="preset">
        <AccordionControl>
          Пресет
          <AccordionControlIndicator>▾</AccordionControlIndicator>
        </AccordionControl>
        <AccordionContent>
          <FeedPreset />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="openapi">
        <AccordionControl>
          Ручка API
          <AccordionControlIndicator>▾</AccordionControlIndicator>
        </AccordionControl>
        <AccordionContent>
          <FeedOpenapi />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="manual">
        <AccordionControl>
          Ручной ввод
          <AccordionControlIndicator>▾</AccordionControlIndicator>
        </AccordionControl>
        <AccordionContent>
          <FeedManual />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
