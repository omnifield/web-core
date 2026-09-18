import { For } from "solid-js";
import { Flow, FlowItem, Typography, useCarousel } from "@web-core/ui";
import type { Cell } from "../../../../lib/cell";
import type { Group } from "../../../../lib/group";
import { useStand } from "../../../../model";
import { ControlNavigation, SwitchSecondaryIndex } from "../../controls";
import { Axis } from "./axis";
import { Wrapper } from "./wrapper";

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

// Одна обёртка на группу, независимая от соседних: горизонтальный carousel листает primary
// (столько слайдов, сколько элементов в группе — без кросс-продукта с secondary). Secondary —
// общий на всю обёртку пикер, который адресует ГРУППУ напрямую: обёртка и есть группа, ячейка ей
// для этого не нужна. Слайды читают тот же scope (`secondaryIndex(cell)` резолвит его по
// `layoutMode`), поэтому меняются синхронно.
function MatrixGroup(props: {
  group: Group<Cell>;
  secondaryItems: readonly SecondaryItem[];
}) {
  const { store, secondaryIndexOfGroup } = useStand();
  const primary = useCarousel(() => ({ slideCount: props.group.items.length }));

  return (
    <Flow data-variant="column">
      {props.group.label !== "" && <Typography>{props.group.label}</Typography>}
      <FlowItem>
        <ControlNavigation api={primary} orientation="horizontal" />
        <SwitchSecondaryIndex
          items={props.secondaryItems}
          index={secondaryIndexOfGroup(props.group.label)}
          onSelect={(index) =>
            store.actions.setSecondaryIndexOfGroup(index, props.group.label)
          }
        />
      </FlowItem>
      <FlowItem>
        <Axis api={primary} items={props.group.items} orientation="horizontal">
          {(cell) => <Wrapper cell={cell} />}
        </Axis>
      </FlowItem>
    </Flow>
  );
}
