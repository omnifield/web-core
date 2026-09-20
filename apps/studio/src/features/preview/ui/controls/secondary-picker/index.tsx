import { For } from "solid-js";
import {
  Select,
  SelectContent,
  SelectControl,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";

type SecondaryItem = { readonly name: string };

/** Выбор secondary-элемента — один и тот же контрол для grid и matrix. Сам он ничего не адресует:
 *  показывает список, отдаёт выбранную позицию. Кого этот выбор касается — отдельную ячейку (grid)
 *  или всю обёртку разом (matrix), — знает контейнер, который его ставит, и он же зовёт нужное
 *  действие стора. Раньше контрол принимал `cell` и в matrix ему подсовывали «любую ячейку из
 *  группы» (`items[0]`), чтобы стор вывел из неё группу: тип обещал `Cell`, значение могло быть
 *  `undefined`, а смысл «ячейка» был подложным — адресовали-то группу. */
export function SwitchSecondaryIndex(props: {
  items: readonly SecondaryItem[];
  index: number;
  onSelect: (index: number) => void;
}) {
  const options = () =>
    props.items.map((item, index) => ({
      value: String(index),
      label: item.name,
    }));

  const selected = () => {
    const item = options()[props.index];
    return item === undefined ? [] : [item.value];
  };

  return (
    <Select
      items={options()}
      value={selected()}
      onValueChange={(details) => {
        const item = details.items[0];
        if (item === undefined) return;
        props.onSelect(Number(item.value));
      }}
    >
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder="Выбрать" />
        </SelectTrigger>
        <SelectIndicator>▾</SelectIndicator>
      </SelectControl>
      <SelectPositioner>
        <SelectContent>
          <For each={options()}>
            {(item) => (
              <SelectItem item={item}>
                <SelectItemText>{item.label}</SelectItemText>
                <SelectItemIndicator>✓</SelectItemIndicator>
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </SelectPositioner>
    </Select>
  );
}
