import type { CompositionElement, CompositionSpec } from "@web-core/assembly";
import { type ComponentIo, ioOf } from "@web-core/ui/io";
import type { ModuleTemplate } from "./templates";

/** Подписанный узел модуля: чем адресуется снаружи, как назван и какую форму объявил его
 *  компонент. Форма берётся из кита как есть — второй её копии у витрины нет. */
export interface ModuleInput {
  readonly id: string;
  readonly label: string;
  readonly component: string;
  readonly io: ComponentIo | undefined;
}

// Ярлык узла из кита не выводится, поэтому объявляется в самой спеке рядом с подписью — FAQ.md.
type SignedElement = CompositionElement & { readonly label?: string };

const isElement = (spec: CompositionSpec): spec is CompositionElement =>
  !("genus" in spec) && !("module" in spec);

function inputsIn(spec: CompositionElement): readonly ModuleInput[] {
  const node = spec as SignedElement;
  const own =
    node.id === undefined
      ? []
      : [
          {
            id: node.id,
            label: node.label ?? node.id,
            component: node.type,
            io: ioOf(node.type),
          },
        ];

  return [
    ...own,
    ...(spec.children ?? []).filter(isElement).flatMap(inputsIn),
  ];
}

export function moduleIoOf(template: ModuleTemplate): readonly ModuleInput[] {
  return inputsIn(template.composition);
}
