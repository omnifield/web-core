import { createEffect, For, untrack } from "solid-js";
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
import { useInfo } from "#/entities/component";
import { useFeed } from "#/entities/feed";
import { presetPickStoreOf } from "./model";

/**
 * Кормление сохранённой записью: выбрал в списке — компонент ест её.
 *
 * Собственного состояния выбора у контрола нет — он читает его из стора поставщика и туда же
 * пишет, так что расходиться нечему. Саму еду кладёт эффект, а не обработчик: тело записи живёт
 * в кэше запросов и может приехать позже выбора или смениться под ним (агент сохранил пресет —
 * кэш обновился). Подача из эффекта доносит до доски и такое обновление тоже.
 */
export function FeedPreset() {
  const component = useInfo();
  const feed = useFeed(component.name);
  const store = presetPickStoreOf(component.name);

  const items = () =>
    component.content.data().map((preset) => ({
      value: preset.name,
      label: preset.label,
    }));

  const picked = () => store.selectors.name();
  const selected = () => {
    const name = picked();
    return name === undefined ? [] : [name];
  };

  // Компонент должен быть накормлен с первого показа, иначе выходит пустым. Первая запись
  // ставится и тогда, когда выбранное имя в списке отсутствует: список принадлежит ТЕКУЩЕМУ
  // компоненту, а выбор переживает уход со страницы.
  createEffect(() => {
    const list = items();
    if (list.length === 0) return;
    if (list.some((item) => item.value === picked())) return;

    store.actions.pick(list[0].value);
  });

  function serveByName(name: string | undefined) {
    const record = component.content.data().find((preset) => preset.name === name);
    if (record === undefined) return;

    feed.serve("preset", record.state.data);
  }

  createEffect(() => {
    const name = picked();

    // Чужую подачу сама собой не перебиваем: человек мог поправить еду руками или взять её из
    // ручки, и возврат на компонент не должен молча откатывать это к записи. Имён соседей
    // поставщик при этом не знает — только «положил не я». Метка читается вне слежения: иначе
    // собственная подача разбудила бы этот же эффект.
    const servedByOther = untrack(() => {
      const by = feed.servedBy();
      return by !== undefined && by !== "preset";
    });
    if (servedByOther) return;

    serveByName(name);
  });

  return (
    <Select
      items={items()}
      value={selected()}
      onValueChange={(details) => {
        const item = details.items[0];
        if (item === undefined) return;

        // Выбор руками кормит сразу, не дожидаясь эффекта: тот чужую подачу не перебивает, а
        // здесь человек как раз и просит её заменить.
        store.actions.pick(item.value);
        serveByName(item.value);
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
