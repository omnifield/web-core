import { type Oklch } from "./oklch.js";
import { parseColor } from "./parse.js";

export const OKLAB_JND = 0.02;

export function deltaEok(a: Oklch | string, b: Oklch | string): number {
  const first = typeof a === "string" ? parseColor(a) : a;
  const second = typeof b === "string" ? parseColor(b) : b;

  const axes = (color: Oklch): [number, number] => {
    const rad = (color.h * Math.PI) / 180;
    return [color.c * Math.cos(rad), color.c * Math.sin(rad)];
  };

  const [firstA, firstB] = axes(first);
  const [secondA, secondB] = axes(second);

  return Math.hypot(first.l - second.l, firstA - secondA, firstB - secondB);
}
