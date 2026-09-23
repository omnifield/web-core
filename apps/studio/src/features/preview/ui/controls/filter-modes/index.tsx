import { For } from "@web-core/solid";
import { Icon, ToggleGroup, ToggleGroupItem } from "@web-core/ui";
import { FILTER_MODES, filterAppliesTo } from "../../../model";
import { usePreview } from "../../../use";

export function SwitchFilterMode() {
  const { store } = usePreview();
  const filterMode = store.use((state) => state.filterMode);
  const axisMode = store.use((state) => state.axisMode);

  return (
    <ToggleGroup
      value={[filterMode()]}
      onValueChange={(details) => {
        // Повторный клик по нажатому режиму снимает его и приносит пустой список. «Никакого
        // режима» у фильтра не бывает (без группировки — это `none`), такой клик ничего не меняет.
        const next = FILTER_MODES.find(
          (mode) => mode.value === details.value[0],
        );
        if (next === undefined) return;

        store.actions.setFilterMode(next.value);
      }}
    >
      <For each={FILTER_MODES}>
        {(mode) => (
          <ToggleGroupItem
            value={mode.value}
            disabled={!filterAppliesTo(mode.value, axisMode())}
          >
            <Icon name={mode.icon} />
          </ToggleGroupItem>
        )}
      </For>
    </ToggleGroup>
  );
}
