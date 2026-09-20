import {
  Accordion,
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
  Flow,
} from "@web-core/ui";
import {
  FeedManual,
  FeedPreset,
  SwitchAxisMode,
  SwitchFilterMode,
  SwitchLayoutMode,
  SwitchViewMode,
} from "#/features/preview";

export function Control() {
  return (
    <Flow data-variant="column">
      <Flow data-variant="row">
        <SwitchViewMode scope="global" />
        <SwitchFilterMode />
        <SwitchLayoutMode />
        <SwitchAxisMode />
      </Flow>

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
    </Flow>
  );
}
