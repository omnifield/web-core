import { describe, expect, it } from "vitest";

import { axisOf } from "../src/engine/axes.js";
import {
  DERIVED_SCALES,
  SPACE_BANDS,
  SPACE_ROLES,
  type SpaceBand,
  type SpaceRole,
} from "../src/engine/dimension.js";

const SPACE = DERIVED_SCALES.find((scale) => scale.seed === "space")!;

const SPACE_STEP_NAMES = new Set(SPACE.steps.map((step) => step.name));

const SEED = axisOf("space")!.reference.value;

const rem = (value: string): number => Number.parseFloat(value);

/** Значение ступени в rem при опорном семени и плотности 1. */
function atReference(step: string): number {
  const found = SPACE.steps.find((entry) => entry.name === step)!;

  return SEED * ("factor" in found ? found.factor : Number.NaN);
}

const BANDS = Object.keys(SPACE_BANDS) as SpaceBand[];

describe("SPACE_ROLES", () => {
  it("каждая роль называет ступень, которая реально существует у шкалы space", () => {
    for (const [role, entry] of Object.entries(SPACE_ROLES)) {
      expect(SPACE_STEP_NAMES.has(entry.step), `роль «${role}» → «${entry.step}»`).toBe(true);
    }
  });

  it("перечень ролей непуст и у каждой роли есть означение для человека", () => {
    const roles = Object.keys(SPACE_ROLES) as SpaceRole[];
    expect(roles.length).toBeGreaterThan(0);

    for (const role of roles) {
      expect(SPACE_ROLES[role].means.length, `роль «${role}» без means`).toBeGreaterThan(0);
    }
  });
});

describe("полосы шкалы интервалов", () => {
  it("полосы идут по возрастанию и не перекрываются", () => {
    const edges = BANDS.map((band) => SPACE_BANDS[band]);

    for (const band of edges) expect(rem(band.floor)).toBeLessThanOrEqual(rem(band.ceiling));

    for (let index = 1; index < edges.length; index += 1) {
      expect(rem(edges[index]!.floor), `полоса ${BANDS[index]} начинается не выше предыдущей`).toBeGreaterThan(
        rem(edges[index - 1]!.ceiling),
      );
    }
  });

  it.each(Object.keys(SPACE_ROLES) as SpaceRole[])(
    "роль %s при опорном семени попадает в свою полосу",
    (role) => {
      const entry = SPACE_ROLES[role];
      const band = SPACE_BANDS[entry.band];
      const value = atReference(entry.step);

      expect(value, `${entry.step} = ${value}rem, полоса ${entry.band} — ${band.floor}…${band.ceiling}`)
        .toBeGreaterThanOrEqual(rem(band.floor));
      expect(value, `${entry.step} = ${value}rem, полоса ${entry.band} — ${band.floor}…${band.ceiling}`)
        .toBeLessThanOrEqual(rem(band.ceiling));
    },
  );

  it("каждая ступень шкалы при опорном семени попадает РОВНО в одну полосу", () => {
    for (const step of SPACE.steps) {
      const value = atReference(step.name);
      const hits = BANDS.filter(
        (band) => value >= rem(SPACE_BANDS[band].floor) && value <= rem(SPACE_BANDS[band].ceiling),
      );

      expect(hits, `ступень «${step.name}» (${value}rem) попала в полосы: ${hits.join(", ") || "ни в одну"}`).toHaveLength(1);
    }
  });
});
