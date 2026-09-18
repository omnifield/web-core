import type { NativeStyle } from "@web-core/skin";

/** Край плоскости, к которому прижата накладная часть — линейка или индикатор. */
export type PlanePlacement = "top" | "bottom" | "left" | "right";

const EDGE = {
  top: { top: "0", left: "50%", transform: "translateX(-50%)" },
  bottom: { bottom: "0", left: "50%", transform: "translateX(-50%)" },
  left: { left: "0", top: "50%", transform: "translateY(-50%)" },
  right: { right: "0", top: "50%", transform: "translateY(-50%)" },
} as const satisfies Record<PlanePlacement, NativeStyle>;

/**
 * Накладная часть: прижата к своему краю, отцентрована по своей оси, места в потоке не занимает.
 *
 * Работает только внутри `PlaneStack` — он задаёт систему координат. Без него `placement` не
 * указывают, и часть встаёт в поток обычным образом.
 */
export function placementStyle(placement?: PlanePlacement): NativeStyle {
  return placement === undefined
    ? {}
    : { position: "absolute", "z-index": "1", ...EDGE[placement] };
}
