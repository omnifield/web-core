import { batch, createSignal, For } from "solid-js";
import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import { type Cell, cellSize } from "../../../../lib/cell";
import type { Group } from "../../../../lib/group";
import type { PlanePosition } from "../../../../lib/plane";
import { useStand } from "../../../../model";
import { Switcher } from "../../views";
import { Plane } from "./plane";
import { Ruler } from "./ruler";

type SecondaryItem = { readonly name: string };

export function Matrix(props: {
  groups: readonly Group<Cell>[];
  secondaryItems: readonly SecondaryItem[];
}) {
  return (
    <For each={props.groups}>
      {(group) => (
        <MatrixGroup group={group} secondaryItems={props.secondaryItems} />
      )}
    </For>
  );
}

/**
 * Одна обёртка на группу: плоскость и две линейки по её краям.
 *
 * Горизонталь — primary, вертикаль — secondary, и обе свайпаются: это одна scroll-snap
 * плоскость, а не карусель в карусели. Вложенность здесь пробовали не раз и она не выходит —
 * два скроллера поперёк друг друга делят один жест, и на тач-устройствах внутренний то
 * перехватывает чужую ось, то не активируется вовсе. В одном контейнере разведение осей делает
 * сам браузер (axis locking), и делать нам нечего.
 *
 * Позиции хранятся по-разному, и это не небрежность. Secondary — общий на всю обёртку и живёт
 * в сторе: слайды обязаны листаться синхронно, иначе выходит зигзаг (разбор в README). Primary
 * — позиция взгляда внутри этой обёртки, состояние показа, а не выбора: её не с чем
 * синхронизировать и незачем переживать перерисовку соседей.
 */
function MatrixGroup(props: {
  group: Group<Cell>;
  secondaryItems: readonly SecondaryItem[];
}) {
  const { store, component, primaryItems, secondaryIndexOfGroup } = useStand();
  const [column, setColumn] = createSignal(0);

  const row = () => secondaryIndexOfGroup(props.group.label);
  const position = (): PlanePosition => ({ column: column(), row: row() });

  /** Деления горизонтальной линейки — имена тех primary-элементов, что попали в эту группу.
   *  `cell.primary` — позиция в полном списке оси, группа же держит только свою порцию. */
  const columnItems = () =>
    props.group.items.map((cell) => ({
      name: primaryItems()[cell.primary]?.name ?? String(cell.primary),
    }));

  function selectRow(next: number) {
    store.actions.setSecondaryIndexOfGroup(next, props.group.label);
  }

  // Обе координаты одной записью. Порознь между ними успевает пройти отрисовка с позицией
  // «столбец уже новый, строка ещё старая» — плоскость видит её как «позицию сменили снаружи»
  // и честно уезжает по вертикали обратно. Вскрывается только диагональным жестом: по одной
  // оси второй координате меняться не с чего.
  function move(next: PlanePosition) {
    batch(() => {
      setColumn(next.column);
      if (next.row !== row()) selectRow(next.row);
    });
  }

  return (
    <Flow data-variant="column">
      {props.group.label !== "" && <Typography>{props.group.label}</Typography>}

      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Ruler
          orientation="horizontal"
          items={columnItems()}
          index={column()}
          onSelect={setColumn}
        />
      </FlowItem>

      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Flow style={layoutGroup({ align: "start" })}>
          <Ruler
            orientation="vertical"
            items={props.secondaryItems}
            index={row()}
            onSelect={selectRow}
          />
          <FlowItem style={layoutSelf({ grow: true, align: "stretch" })}>
            <Plane
              columns={props.group.items}
              rows={props.secondaryItems}
              position={position()}
              onMove={move}
              style={cellSize(component.editorInfo()?.footprint)}
            >
              {(cell) => (
                <Switcher cell={cell.column} secondary={cell.position.row} />
              )}
            </Plane>
          </FlowItem>
        </Flow>
      </FlowItem>
    </Flow>
  );
}
