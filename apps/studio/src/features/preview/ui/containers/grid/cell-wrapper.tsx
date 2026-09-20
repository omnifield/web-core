import { layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Surface } from "@web-core/ui";
import { type Cell, cellSize } from "../../../lib/cell";
import { usePreview } from "../../../model";
import { SwitchSecondaryIndex } from "../../controls";
import { Switcher } from "../../views";

type SecondaryItem = { readonly name: string };

export function CellWrapper(props: {
  cell: Cell;
  secondaryItems: readonly SecondaryItem[];
}) {
  const { store, component, secondaryIndexOf } = usePreview();
  const footprint = () => component.editorInfo()?.footprint;

  return (
    <Surface style={cellSize(footprint())}>
      <Flow data-variant="column">
        <FlowItem>
          <SwitchSecondaryIndex
            items={props.secondaryItems}
            index={secondaryIndexOf(props.cell)}
            onSelect={(index) =>
              store.actions.setSecondaryIndexOfCell(index, props.cell)
            }
          />
        </FlowItem>
        <FlowItem style={layoutSelf({ align: "stretch" })}>
          <Switcher cell={props.cell} />
        </FlowItem>
      </Flow>
    </Surface>
  );
}
