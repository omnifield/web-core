export interface FieldBinding {
  readonly value: () => unknown;
  readonly onChange: (value: unknown) => void;
}

export function itemBinding(listBinding: FieldBinding, items: () => readonly unknown[], index: number): FieldBinding {
  return {
    value: () => items()[index],
    onChange: (next) => listBinding.onChange(items().map((current, i) => (i === index ? next : current))),
  };
}
