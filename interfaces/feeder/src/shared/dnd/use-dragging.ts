import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { createSignal, onCleanup, type Accessor } from "@web-core/solid";

export function useDragging(): Accessor<boolean> {
  const [active, setActive] = createSignal(false);

  onCleanup(
    monitorForElements({
      onDragStart: () => setActive(true),
      onDrop: () => setActive(false),
    }),
  );

  return active;
}
