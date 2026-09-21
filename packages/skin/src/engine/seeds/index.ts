
import type { Skin, SkinVariables } from "../recipe/index.js";
import { sizeValues } from "../sizes/index.js";
import { trace } from "../../trace/index.js";
import { seeded } from "./build.js";
import type { SkinHalf, SkinValue } from "./types.js";

export type { SkinHalf, SkinValue, ValueOrigin } from "./types.js";
export { NOT_SEEDED } from "./not-seeded.js";
export { checkCategories, type CategoryClash } from "./category.js";
export { seedRefusals, type SeedRefusal } from "./refusals.js";

/** Значения половины — чистая функция от `skin.variables`, поэтому помнятся по самому объекту
 *  переменных. Разбор — FAQ.md. */
const remembered = new WeakMap<SkinVariables, Map<SkinHalf, Map<string, SkinValue>>>();

export function skinValues(skin: Skin, half: SkinHalf): Map<string, SkinValue> {
  const variables = skin.variables;
  const halves = variables === undefined ? undefined : remembered.get(variables);
  const known = halves?.get(half);
  if (known !== undefined) return known;

  const done = trace(`skinValues(${skin.name}, ${half})`);

  const literal = (source: Readonly<Record<string, string>> | undefined): [string, SkinValue][] =>
    Object.entries(source ?? {}).map(([name, value]) => [name, { value, from: "literal" }]);

  const values = new Map<string, SkinValue>(
    half === "light"
      ? [...seeded(variables, "light"), ...literal(variables?.light)]
      : [...literal(variables?.light), ...seeded(variables, "dark"), ...literal(variables?.dark)],
  );

  if (variables !== undefined) {
    const store = halves ?? new Map<SkinHalf, Map<string, SkinValue>>();
    store.set(half, values);
    remembered.set(variables, store);
  }

  done();
  return values;
}

export function valueNames(skin: Skin): Set<string> {
  return new Set([...skinValues(skin, "light").keys(), ...skinValues(skin, "dark").keys(), ...sizeValues(skin).keys()]);
}
