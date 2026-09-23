
import { axisOf } from "@web-core/style";
import { trace } from "../../trace/index.js";
import { isFluid } from "../fluid/index.js";
import { measure } from "../fluid/measure.js";
import type { SkinVariables } from "../recipe/index.js";

export interface SeedOffset {
  readonly seed: string;
  /** Только у текучего семени: у литерала полюса нет. */
  readonly pole?: "narrow" | "wide";
  readonly unit: string;
  readonly value: number;
  readonly reference: number;
  /** Во сколько раз семя ушло от опоры; `null` — опора ноль, отношения не существует. */
  readonly times: number | null;
  /** След сверки опоры с рынком — дословно от зоны значений, с датой. */
  readonly market: string;
  readonly means: string;
}

const TOLERANCE = 0.001;

function offsetOf(seed: string, value: string, pole?: "narrow" | "wide"): SeedOffset | null {
  const axis = axisOf(seed);
  if (axis === undefined) return null;

  const measured = measure(value);
  if (measured === null) return null;

  // Безразмерный множитель пишется голым числом ("0.8"), длина — с единицей своей оси.
  const expected = axis.unit === "множитель" ? "" : axis.unit;
  if (measured.unit !== expected) return null;

  const reference = axis.reference.value;
  const times = reference === 0 ? null : measured.amount / reference;

  if (times === null ? measured.amount === 0 : Math.abs(times - 1) <= TOLERANCE) return null;

  const at = pole === undefined ? "" : ` на ${pole === "narrow" ? "узком" : "широком"} полюсе`;
  const drift =
    times === null
      ? `опора этой оси — ноль, «во сколько раз» тут не считается`
      : `это ${times.toFixed(2)}× от опоры ${reference}${axis.unit}`;

  return {
    seed,
    ...(pole === undefined ? {} : { pole }),
    unit: axis.unit,
    value: measured.amount,
    reference,
    times,
    market: axis.reference.market,
    means:
      `семя "${seed}"${at} — ${value}, ${drift}. Каждая ступень этой оси уедет во столько же раз, ` +
      "то есть словарь ролей сместится целиком. Уход от опоры законен, молчаливый уход — нет",
  };
}

export function checkCalibration(variables: SkinVariables | undefined): readonly SeedOffset[] {
  const done = trace("checkCalibration");

  const offsets: SeedOffset[] = [];

  for (const [seed, declaration] of Object.entries(variables?.dimensions ?? {})) {
    if (isFluid(declaration)) {
      const narrow = offsetOf(seed, declaration.narrow, "narrow");
      if (narrow) offsets.push(narrow);

      const wide = offsetOf(seed, declaration.wide, "wide");
      if (wide) offsets.push(wide);
      continue;
    }

    const literal = offsetOf(seed, declaration);
    if (literal) offsets.push(literal);
  }

  done();
  return offsets;
}
