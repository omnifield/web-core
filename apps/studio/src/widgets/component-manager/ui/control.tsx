import {
  Accordion,
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
  Flow,
  Grid,
  GridCell,
} from "@web-core/ui";
import {
  FeedManual,
  FeedPreset,
  SwitchAxisMode,
  SwitchFilterMode,
  SwitchLayoutMode,
  SwitchViewMode,
} from "#/features/component-manager";

// Раскладка переключателей задана здесь, а не вариантом формы `omnifield-grid`: она про ЭТУ панель
// (кто с кем в ряду), а не про сетку вообще. Устоится — переедет в форму отдельным вариантом,
// пока вариант ради одного места плодить незачем. Ключи kebab-case — нативный `style`, как в
// `layoutSelf`/`layoutGroup`.
const switchGrid = {
  "grid-template-columns": "repeat(2, minmax(0, 1fr))",
  "justify-items": "center",
};

const wholeRow = { "grid-column": "1 / -1" };

export function Control() {
  return (
    <Flow data-variant="column">
      <Grid data-variant="gallery" style={switchGrid}>
        <GridCell style={wholeRow}>
          <SwitchViewMode />
        </GridCell>
        <GridCell style={wholeRow}>
          <SwitchFilterMode />
        </GridCell>
        <GridCell>
          <SwitchLayoutMode />
        </GridCell>
        <GridCell>
          <SwitchAxisMode />
        </GridCell>
      </Grid>

      <Accordion collapsible defaultValue={["preset"]}>
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
