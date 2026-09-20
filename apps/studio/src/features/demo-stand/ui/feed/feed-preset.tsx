import { createEffect, For } from "solid-js";
import {
  Select,
  SelectContent,
  SelectControl,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";
import { useComponent } from "#/entities/component";
import { useStandStore } from "../../model";

/**
 * Выбор пресета данных для всего стенда.
 *
 * В контрол уходят только имя и подпись — тело пресета через него НЕ течёт. Тело живёт в кэше
 * запросов, и всё, что стенд о нём помнит, — выбранное имя (разбор у типа `Feed` в
 * `model/store.ts`). Собственного состояния выбора у контрола тоже нет: выбранное он читает из
 * стора и туда же пишет, так что расходиться нечему.
 */
export function FeedPreset() {
  const store = useStandStore();
  const component = useComponent();

  const items = () =>
    component.content().map((preset) => ({
      value: preset.name,
      label: preset.label,
    }));

  const presetName = () => {
    const feed = store.selectors.standFeed();
    return feed?.kind === "preset" ? feed.name : undefined;
  };
  const selected = () => {
    const name = presetName();
    return name === undefined ? [] : [name];
  };

  // Стенд должен быть накормлен с первого показа, иначе компонент выходит пустым. Первый пресет
  // ставится и тогда, когда выбранного имени в списке нет: список — пресеты ТЕКУЩЕГО компонента,
  // а стор переживает уход со страницы. Ручной корм не трогаем: он не выбирается именем, и
  // подменять его пресетом — значит терять то, что человек набрал.
  createEffect(() => {
    const list = items();
    if (list.length === 0) return;
    if (store.selectors.standFeed()?.kind === "manual") return;
    if (list.some((item) => item.value === presetName())) return;

    store.actions.setFeedPreset(list[0].value);
  });

  return (
    <Select
      items={items()}
      value={selected()}
      onValueChange={(details) => {
        const item = details.items[0];
        if (item === undefined) return;
        store.actions.setFeedPreset(item.value);
      }}
    >
      <SelectLabel>Пресет</SelectLabel>
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder="Выберите пресет" />
        </SelectTrigger>
        <SelectIndicator>▾</SelectIndicator>
      </SelectControl>
      <SelectPositioner>
        <SelectContent>
          <For each={items()}>
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
