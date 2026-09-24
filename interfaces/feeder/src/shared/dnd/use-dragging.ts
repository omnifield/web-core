import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { createSignal, onCleanup, type Accessor } from "@web-core/solid";

export function useDragging(): Accessor<Record<string, unknown> | undefined> {
  const [carried, setCarried] = createSignal<Record<string, unknown>>();

  onCleanup(
    monitorForElements({
      onDragStart: ({ source }) => setCarried(() => source.data),
      onDrop: () => setCarried(undefined),
    }),
  );

  return carried;
}
