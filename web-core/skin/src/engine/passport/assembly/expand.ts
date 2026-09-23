
import { baseAssemblyOf as baseAssemblyOfReal, type AssemblyTemplate, type AssemblyTree } from "@web-core/assembly";

import type { ComponentPassport } from "../form/index.js";
import type { PassportAssembly } from "./assembly.js";

export { scopedPath } from "@web-core/assembly";

/** Тонкая обёртка — сам разворот `repeat`/`recur` по данным живёт в `@web-core/assembly`, разбор в
 *  FAQ.md. */
export function baseAssemblyOf(
  passport: ComponentPassport,
  assembly: PassportAssembly,
  address: string = passport.component,
  data?: unknown,
): AssemblyTree {
  return baseAssemblyOfReal(passport, assembly as unknown as AssemblyTemplate, address, data);
}
