import { For } from "solid-js";
import {
  Icon,
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";
import {
  FILTER_MODES,
  filterAppliesTo,
  useStandStore,
  type FilterMode,
} from "../../../../model";

export function SwitchFilterMode() {
  const store = useStandStore();
  const filterMode = store.use((state) => state.filterMode);
  const axisMode = store.use((state) => state.axisMode);

  return (
    <SegmentGroup
      orientation="horizontal"
      value={filterMode()}
      onValueChange={(details) => {
        if (details.value) {
          store.actions.setFilterMode(details.value as FilterMode);
        }
      }}
    >
      <SegmentGroupIndicator />
      {/* Неприменимый к текущей оси режим гасим, а не прячем: исчезающая кнопка дёргает
          раскладку и не объясняет, куда делась, — выключенная говорит «такой режим есть, но не
          на этой оси». В состоянии его не остаётся: `setAxisMode` сбрасывает сам. */}
      <For each={FILTER_MODES}>
        {(mode) => (
          <SegmentGroupItem
            value={mode.value}
            disabled={!filterAppliesTo(mode.value, axisMode())}
          >
            <SegmentGroupItemControl />
            <SegmentGroupItemText>
              <Icon name={mode.icon} />
            </SegmentGroupItemText>
          </SegmentGroupItem>
        )}
      </For>
    </SegmentGroup>
  );
}
