import { batch, createSignal, For } from "@web-core/solid";
import { layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Surface, Typography } from "@web-core/ui";
import {
  Plane,
  PlaneIndicator,
  type PlanePosition,
  PlaneRuler,
  PlaneStack,
} from "#/shared/ui/plane";
import { type Cell, cellSize } from "../../../lib/cell";
import type { Group } from "../../../lib/group";
import { usePreview } from "../../../use";
import { Switcher } from "../../views";

type SecondaryItem = { readonly name: string };

export function Matrix(props: {
  groups: readonly Group<Cell>[];
  secondaryItems: readonly SecondaryItem[];
}) {
  return (
    <Flow data-variant="column">
      <For each={props.groups}>
        {(group) => (
          <MatrixGroup group={group} secondaryItems={props.secondaryItems} />
        )}
      </For>
    </Flow>
  );
}

/**
 * Одна обёртка на группу: плоскость и две линейки по её краям.
 *
 * Горизонталь — primary, вертикаль — secondary, и обе свайпаются. Сама механика двухосевой
 * плоскости здесь не живёт: она общая (`#/shared/ui/plane`, там же разбор, почему один
 * контейнер, а не карусель в карусели). Здесь — только применение: что показывать в клетке и
 * откуда брать позицию.
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
  const { store, component, primaryItems, secondaryIndexOfGroup } = usePreview();
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
    <Surface>
      <Flow data-variant="column">
        {props.group.label !== "" && (
          <Typography>{props.group.label}</Typography>
        )}

        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <PlaneStack>
            <Plane
              columns={props.group.items}
              rows={props.secondaryItems}
              position={position()}
              onMove={move}
              scrollbar={false}
              style={cellSize(component.editorInfo()?.footprint)}
            >
              {(cell) => (
                <Switcher cell={cell.column} secondary={cell.position.row} />
              )}
            </Plane>

            <PlaneRuler
              placement="top"
              orientation="horizontal"
              items={columnItems()}
              index={column()}
              onSelect={setColumn}
            />
            <PlaneRuler
              placement="left"
              orientation="vertical"
              items={props.secondaryItems}
              index={row()}
              onSelect={selectRow}
            />

            {/* Точки встают там же, где были полосы прокрутки: снизу — горизонтальная ось,
              справа — вертикальная. Полосы у плоскости выключены, чтобы не показывать одно и
              то же дважды. */}
            <PlaneIndicator
              placement="bottom"
              orientation="horizontal"
              items={columnItems()}
              index={column()}
              onSelect={setColumn}
            />
            <PlaneIndicator
              placement="right"
              orientation="vertical"
              items={props.secondaryItems}
              index={row()}
              onSelect={selectRow}
            />
          </PlaneStack>
        </FlowItem>
      </Flow>
    </Surface>
  );
}
