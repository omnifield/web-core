import { Icon, type IconProps, Toggle, ToggleIndicator } from "@web-core/ui";
import { LAYOUT_MODES } from "../../../model";
import { usePreview } from "../../../use";

type IconName = IconProps["name"];

function iconOf<Value extends string>(
  items: readonly { value: Value; icon: IconName }[],
  value: Value,
): IconName {
  return items.find((item) => item.value === value)!.icon;
}

export function SwitchLayoutMode() {
  const { store } = usePreview();
  const layoutMode = store.use((state) => state.layoutMode);

  return (
    <Toggle
      pressed={layoutMode() === "matrix"}
      onPressedChange={(pressed) =>
        store.actions.setLayoutMode(pressed ? "matrix" : "grid")
      }
    >
      <ToggleIndicator fallback={<Icon name={iconOf(LAYOUT_MODES, "grid")} />}>
        <Icon name={iconOf(LAYOUT_MODES, "matrix")} />
      </ToggleIndicator>
    </Toggle>
  );
}
