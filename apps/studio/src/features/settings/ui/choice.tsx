import { For } from "@web-core/solid";
import type { PassportSettingOptionEditorInfo } from "@web-core/skin/editor";
import type { PassportSettingOption } from "@web-core/skin/model";
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";

/** Настройка-выбор: один вариант из перечисленных паспортом. Тот же контрол, которым витрина уже
 *  переключает сборки, — выбор одного из равноправных значений выглядит одинаково. */
export function Choice(props: {
  options: readonly PassportSettingOption[];
  means: Readonly<Record<string, PassportSettingOptionEditorInfo>> | undefined;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <SegmentGroup
      orientation="horizontal"
      disabled={props.disabled}
      value={props.value}
      onValueChange={(details) => {
        if (details.value) props.onChange(details.value);
      }}
    >
      <SegmentGroupIndicator />
      <For each={props.options}>
        {(option) => (
          <SegmentGroupItem
            value={option.value}
            title={props.means?.[option.value]?.means}
          >
            <SegmentGroupItemControl />
            <SegmentGroupItemText>{option.value}</SegmentGroupItemText>
          </SegmentGroupItem>
        )}
      </For>
    </SegmentGroup>
  );
}
