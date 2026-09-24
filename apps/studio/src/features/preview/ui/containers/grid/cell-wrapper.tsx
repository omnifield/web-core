import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Flow, FlowItem, Surface } from "@web-core/ui";
import { type Cell, cellSize } from "../../../lib/cell";
import { usePreview } from "../../../use";
import { SwitchSecondaryIndex } from "../../controls";
import { Switcher } from "../../views";

type SecondaryItem = { readonly name: string };

/** Колонка ячейки тянется на всю её высоту — иначе показу нечего занимать, и он прижимается к
 *  переключателю сверху. `min-block-size: 0` рядом обязателен: без него растянутая колонка растёт
 *  под содержимым и вылезает за отведённую ячейке высоту вместо того, чтобы дать прокрутку. */
const fill = { "block-size": "100%", "min-block-size": "0" };

/** Показ стоит в середине оставшегося места — центрируют автополя, а не `align-items`.
 *
 *  У ячейки своя высота и своя прокрутка (`cellSize`), а flex-центрирование при переполнении
 *  срезает ВЕРХ содержимого, и доскроллить до него нельзя. Автополя отдают лишнее место поровну
 *  и на переполнении просто перестают действовать. */
const middle = { margin: "auto" };

export function CellWrapper(props: {
  cell: Cell;
  secondaryItems: readonly SecondaryItem[];
}) {
  const { store, component, secondaryIndexOf } = usePreview();
  const footprint = () => component.editorInfo()?.footprint;

  return (
    <Surface style={cellSize(footprint())}>
      <Flow data-variant="column" style={fill}>
        <FlowItem>
          <SwitchSecondaryIndex
            items={props.secondaryItems}
            index={secondaryIndexOf(props.cell)}
            onSelect={(index) =>
              store.actions.setSecondaryIndexOfCell(index, props.cell)
            }
          />
        </FlowItem>
        <FlowItem
          style={{ ...layoutSelf({ grow: true, align: "stretch" }), ...fill }}
        >
          <Flow
            style={{
              ...layoutGroup({ align: "center", justify: "center" }),
              ...fill,
            }}
          >
            <FlowItem style={middle}>
              <Switcher cell={props.cell} />
            </FlowItem>
          </Flow>
        </FlowItem>
      </Flow>
    </Surface>
  );
}
