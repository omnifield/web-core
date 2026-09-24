import { Switch, SwitchControl, SwitchThumb } from "@web-core/ui";

/** Настройка-флаг: включена или нет. Подпись стоит снаружи, рядом с остальными настройками, —
 *  поэтому `SwitchLabel` здесь не ставится. */
export function Flag(props: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      checked={props.checked}
      disabled={props.disabled}
      onCheckedChange={(details) => props.onChange(details.checked)}
    >
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
    </Switch>
  );
}
