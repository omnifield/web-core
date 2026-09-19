import { For } from "solid-js";
import { Icon, ToggleGroup, ToggleGroupItem } from "@web-core/ui";
import type { Cell } from "../../../../lib/cell";
import { ALL_CELLS, useStandStore, VIEW_MODES } from "../../../../model";

/** Адрес вида — размеченный союз, а не необязательная ячейка: «локальный без ячейки» — состояние,
 *  которого не бывает, и запретить его типом дешевле, чем ловить в рантайме. */
export type SwitchViewModeProps =
  | { readonly scope: "global" }
  | { readonly scope: "local"; readonly cell: Cell };

/**
 * Один контрол на оба адреса: глобальный правит вид всему стенду сразу (`ALL_CELLS` в
 * `model/store.ts`), локальный — одной ячейке. Различались они ровно адресом — список режимов,
 * разметка и поведение совпадали, — и две копии разъезжались бы на первой же правке `VIEW_MODES`.
 *
 * Группа тумблеров: вид — выбор одного из равноправных режимов, поэтому `multiple` здесь не
 * ставится (по паспорту он и так `false`), а «никакого вида» у стенда не бывает — снятие
 * последнего нажатого гасится ниже.
 */
export function SwitchViewMode(props: SwitchViewModeProps) {
  const store = useStandStore();
  const standViewMode = store.use(
    (state) => state.viewMode[ALL_CELLS] ?? "form",
  );

  const viewMode = () =>
    props.scope === "local"
      ? store.selectors.viewMode(props.cell)
      : standViewMode();

  return (
    <ToggleGroup
      value={[viewMode()]}
      onValueChange={(details) => {
        // Повторный клик по нажатому режиму снимает его и приносит пустой список. Показывать
        // ячейке нечего — такой клик не меняет ничего, вместо того чтобы оставить её пустой.
        const next = VIEW_MODES.find((mode) => mode.value === details.value[0]);
        if (next === undefined) return;

        store.actions.setViewMode(
          next.value,
          props.scope === "local" ? props.cell : undefined,
        );
      }}
    >
      <For each={VIEW_MODES}>
        {(mode) => (
          <ToggleGroupItem value={mode.value}>
            <Icon name={mode.icon} />
          </ToggleGroupItem>
        )}
      </For>
    </ToggleGroup>
  );
}
