import { Icon, type IconProps, Toggle, ToggleIndicator } from "@web-core/ui";
import { AXIS_MODES } from "../../../model";
import { usePreview } from "../../../use";

type IconName = IconProps["name"];

function iconOf<Value extends string>(
  items: readonly { value: Value; icon: IconName }[],
  value: Value,
): IconName {
  return items.find((item) => item.value === value)!.icon;
}

export function SwitchAxisMode() {
  const { store } = usePreview();
  const axisMode = store.use((state) => state.axisMode);

  return (
    <Toggle
      pressed={axisMode() === "assembly"}
      onPressedChange={(pressed) =>
        store.actions.setAxisMode(pressed ? "assembly" : "variant")
      }
    >
      <ToggleIndicator fallback={<Icon name={iconOf(AXIS_MODES, "variant")} />}>
        <Icon name={iconOf(AXIS_MODES, "assembly")} />
      </ToggleIndicator>
    </Toggle>
  );
}
