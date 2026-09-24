import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { onCleanup } from "@web-core/solid";

export function dropTarget(
  element: HTMLElement,
  props: {
    canDrop?: (data: Record<string, unknown>) => boolean;
    onOver?: (over: boolean) => void;
    onDrop: (data: Record<string, unknown>) => void;
  },
): void {
  const over = (state: boolean) => {
    if (state) element.setAttribute("data-over", "");
    else element.removeAttribute("data-over");
    props.onOver?.(state);
  };

  onCleanup(
    dropTargetForElements({
      element,
      canDrop: ({ source }) => props.canDrop?.(source.data) ?? true,
      onDragEnter: () => over(true),
      onDragLeave: () => over(false),
      onDrop: ({ source }) => {
        over(false);
        props.onDrop(source.data);
      },
    }),
  );
}
