
import {
  buildCategoryScales,
  CATEGORY_TELLING,
  deltaEok,
  OKLAB_JND,
  tryParseColor,
  type ScaleValues,
} from "@web-core/style";
import { trace } from "../../trace/index.js";
import type { SkinVariables } from "../recipe/index.js";
import { declared } from "./declare.js";
import type { SkinHalf } from "./types.js";

export interface CategoryClash {
  readonly scale: string;
  readonly half: SkinHalf;
  readonly step: string;
  readonly slots: readonly [number, number];
  readonly distance: number;
  readonly means: string;
}

export function slotClashes(scale: string, half: SkinHalf, slots: readonly ScaleValues[]): CategoryClash[] {
  const clashes: CategoryClash[] = [];

  for (const step of CATEGORY_TELLING) {
    for (let first = 0; first < slots.length; first += 1) {
      for (let second = first + 1; second < slots.length; second += 1) {
        const distance = deltaEok(slots[first]![step], slots[second]![step]);

        if (distance >= OKLAB_JND) continue;

        clashes.push({
          scale,
          half,
          step,
          slots: [first + 1, second + 1],
          distance,
          means:
            `слоты ${first + 1} и ${second + 1} шкалы "${scale}" на ступени ${step} (${half}) ` +
            `расходятся на ${distance.toFixed(3)} при пороге заметности ${OKLAB_JND} — ` +
            "раскрашенные ими категории человек не различит. Ступени " +
            `${CATEGORY_TELLING.join(", ")} — единственные, на которых различимость обещана; ` +
            "лечится семенем шкалы, не формой",
        });
      }
    }
  }

  return clashes;
}

export function checkCategorySlots(variables: SkinVariables | undefined): readonly CategoryClash[] {
  const done = trace("checkCategorySlots");
  const clashes: CategoryClash[] = [];

  for (const [scale, declaration] of Object.entries(variables?.scales ?? {})) {
    const { seed, category } = declared(declaration);

    if (!category || !tryParseColor(seed).ok) continue;

    for (const half of ["light", "dark"] as const) {
      clashes.push(...slotClashes(scale, half, buildCategoryScales(seed, half)));
    }
  }

  done();
  return clashes;
}
