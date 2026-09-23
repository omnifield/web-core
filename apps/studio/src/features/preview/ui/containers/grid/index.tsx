import { For } from "@web-core/solid";
import { Flow, GridCell, Typography, Grid as UiGrid } from "@web-core/ui";
import type { Cell } from "../../../lib/cell";
import type { Group } from "../../../lib/group";
import { CellWrapper } from "./cell-wrapper";

type SecondaryItem = { readonly name: string };

export function Grid(props: {
  groups: readonly Group<Cell>[];
  secondaryItems: readonly SecondaryItem[];
}) {
  return (
    <For each={props.groups}>
      {(group) => (
        <Flow data-variant="column">
          {group.label !== "" && <Typography>{group.label}</Typography>}
          <UiGrid data-variant="gallery">
            <For each={group.items}>
              {(cell) => (
                <GridCell>
                  <CellWrapper
                    cell={cell}
                    secondaryItems={props.secondaryItems}
                  />
                </GridCell>
              )}
            </For>
          </UiGrid>
        </Flow>
      )}
    </For>
  );
}
