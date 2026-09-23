
import { SCALE_STEPS, STEP_PURPOSE_CLASS, type ScaleKey, type StepPurposeClass } from "@web-core/style";

export const SCALE_ROLES: readonly string[] = ["accent", "neutral", "danger", "success", "warning"];

export const STEPS: readonly string[] = [...SCALE_STEPS.map(String), "contrast"];

/** Класс назначения ступени по полному имени переменной (`--accent-9` → `fill`); своя категория
 *  палитры разбирается так же. Не ступень объявленной категории — `undefined`. */
export function colorStepPurpose(name: string, declared: ReadonlySet<string>): StepPurposeClass | undefined {
  const bare = name.startsWith("--") ? name.slice(2) : name;
  const cut = bare.lastIndexOf("-");

  if (cut < 0) return undefined;

  const scale = bare.slice(0, cut);

  if (!declared.has(scale) && !SCALE_ROLES.includes(scale)) return undefined;

  return STEP_PURPOSE_CLASS[bare.slice(cut + 1) as ScaleKey];
}
