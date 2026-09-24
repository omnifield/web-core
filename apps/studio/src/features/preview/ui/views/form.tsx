import type { DispatchedEvent } from "@web-core/assembly";
import type { PassportAssembly } from "@web-core/skin/editor";
import { toast } from "@web-core/ui";
import { useFeed } from "#/entities/feed";
import { useSettings } from "#/entities/settings";
import { Renderer } from "#/shared/ui/renderer";
import type { Cell } from "../../lib/cell";
import { usePreview } from "../../use";

export function Form(props: {
  cell: Cell;
  variant: string;
  assembly: PassportAssembly;
}) {
  const { component } = usePreview();
  const feed = useFeed(component.name);
  const settings = useSettings(
    component.name,
    () => component.passport()?.settings ?? {},
    () => component.editorInfo()?.settings,
  );

  function dispatch(event: DispatchedEvent) {
    console.log(event);
    toast.create({
      title: event.name,
      description: JSON.stringify(event.context, null, 2),
    });
  }

  return (
    <Renderer
      component={component.name()}
      assembly={props.assembly.name}
      variant={props.variant}
      rootProps={settings.values()}
      data={feed.data()}
      dispatch={dispatch}
    />
  );
}
