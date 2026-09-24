import { Flow } from "@web-core/ui";
import {
  SwitchAxisMode,
  SwitchFilterMode,
  SwitchLayoutMode,
  SwitchViewMode,
} from "#/features/preview";

/** Переключатели показа одной строкой: чем показывать ячейку, чем резать на группы, как
 *  разложить и по какой оси умножать. Кормление сюда не входит — это другая ось и другой
 *  виджет (`widgets/feed`). */
export function PreviewControls() {
  return (
    <Flow data-variant="row">
      <SwitchViewMode scope="global" />
      <SwitchFilterMode />
      <SwitchLayoutMode />
      <SwitchAxisMode />
    </Flow>
  );
}
