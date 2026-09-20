import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { onCleanup, type Accessor } from "@web-core/solid";

export function dragSource(
  element: HTMLElement,
  data: Accessor<Record<string, unknown>>,
): void {
  onCleanup(
    draggable({
      element,
      getInitialData: () => data(),
      onDragStart: () => element.setAttribute("data-dragging", ""),
      onDrop: () => element.removeAttribute("data-dragging"),
    }),
  );
}
