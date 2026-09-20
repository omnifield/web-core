const TRANSFER = {
  items: { add: () => undefined },
  types: [] as string[],
  setData: () => undefined,
  getData: () => "",
  setDragImage: () => undefined,
  effectAllowed: "move",
  dropEffect: "move",
};

function fire(element: Element, name: string): void {
  const event = new Event(name, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", { value: TRANSFER });
  element.dispatchEvent(event);
}

export function dragTo(source: Element, target: Element): void {
  fire(source, "dragstart");
  fire(target, "dragover");
  fire(target, "drop");
}
