import { layoutGroup, layoutSelf } from "@web-core/skin";
import { Flow, Typography } from "@web-core/ui";

export function ModulePage(props: { name: string }) {
  return (
    <Flow
      style={{
        ...layoutGroup({ align: "center", justify: "center" }),
        ...layoutSelf({ grow: true, align: "stretch" }),
        height: "100%",
      }}
    >
      <Typography>Модуль «{props.name}» — показа пока нет</Typography>
    </Flow>
  );
}
