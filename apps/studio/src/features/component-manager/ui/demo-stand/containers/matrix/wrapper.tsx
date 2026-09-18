import { layoutSelf } from "@web-core/skin";
import { Surface } from "@web-core/ui";
import { useComponent } from "#/entities/component";
import { cellSize, type Cell } from "../../../../lib/cell";
import { Switcher } from "../../views";

export function Wrapper(props: { cell: Cell }) {
  const component = useComponent();
  const footprint = () => component.editorInfo()?.footprint;

  return (
    <Surface style={{ ...cellSize(footprint()), ...layoutSelf({ align: "stretch" }) }}>
      <Switcher cell={props.cell} />
    </Surface>
  );
}
