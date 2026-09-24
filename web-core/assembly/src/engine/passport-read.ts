// см. README.md / FAQ.md

import type { SelfAssembly } from "./self-assembly.js";

// Свои литеральные объединения, не импорт чужих — почему так, разобрано в FAQ.md.
export type Genus = "text" | "icon";

export type ComponentGenus = "icon" | "component";

export type Admission =
  | { readonly kind: "content"; readonly genus: Genus }
  | { readonly kind: "component"; readonly genus?: ComponentGenus; readonly name?: string };

export interface ReadablePart {
  readonly name: string;
  readonly accepts?: readonly Admission[];
}

export interface ReadablePassport {
  readonly component: string;
  readonly genus: ComponentGenus;
  readonly anatomy: { keys: () => string[] };
  readonly root: string;
  readonly parts: readonly ReadablePart[];
  readonly selfAssembly?: SelfAssembly;
}

// Срез `ReadablePassport` в три поля — всё, что читает рост дерева по шаблону (`expand.ts`).
// Почему срез, а не весь паспорт — FAQ.md.
export interface GrowablePassport {
  readonly component: string;
  readonly anatomy: { keys: () => string[] };
  readonly root: string;
}

export interface AdmissionRule {
  admits(part: ReadablePart, candidate: Admission): boolean;
}

export function partOf(passport: ReadablePassport, name: string): ReadablePart | undefined {
  return passport.parts.find((part) => part.name === name);
}
