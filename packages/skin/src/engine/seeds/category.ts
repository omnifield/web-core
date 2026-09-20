
import { buildScale, CATEGORY_TELLING, deltaEok, OKLAB_JND, tryParseColor } from "@web-core/style";
import { trace } from "../../trace/index.js";
import type { SkinVariables } from "../recipe/index.js";
import { declared } from "./declare.js";
import type { SkinHalf } from "./types.js";

export interface CategoryClash {
  readonly half: SkinHalf;
  readonly step: string;
  readonly categories: readonly [string, string];
  readonly distance: number;
  readonly means: string;
}

export function checkCategories(variables: SkinVariables | undefined): readonly CategoryClash[] {
  const done = trace("checkCategories");

  const seeds = Object.entries(variables?.scales ?? {})
    .map(([name, declaration]) => [name, declared(declaration).seed] as const)
    .filter(([, seed]) => tryParseColor(seed).ok);

  const clashes: CategoryClash[] = [];

  for (const half of ["light", "dark"] as const) {
    const ladders = seeds.map(([name, seed]) => [name, buildScale(seed, half)] as const);

    for (const step of CATEGORY_TELLING) {
      for (let first = 0; first < ladders.length; first += 1) {
        for (let second = first + 1; second < ladders.length; second += 1) {
          const [oneName, one] = ladders[first]!;
          const [twoName, two] = ladders[second]!;
          const distance = deltaEok(one[step], two[step]);

          if (distance >= OKLAB_JND) continue;

          clashes.push({
            half,
            step,
            categories: [oneName, twoName],
            distance,
            means:
              `категории "${oneName}" и "${twoName}" на ступени ${step} (${half}) расходятся на ` +
              `${distance.toFixed(3)} при пороге заметности ${OKLAB_JND} — раскрашенное ими человек ` +
              `не различит. Ступени ${CATEGORY_TELLING.join(", ")} — те, на которых различимость ` +
              "обещана; разводится семенем, не формой",
          });
        }
      }
    }
  }

  done();
  return clashes;
}
