import type { PassportAssembly } from "@web-core/skin/editor";
import type { VariantSummary } from "@web-core/skin/presets";
import type { AxisMode } from "../model/modes";
import type { Cell } from "./cell";

/** Два списка, которыми компонент умножается. Кто из них primary, а кто secondary, здесь не
 *  решается — это `axisMode`, состояние показа. */
export interface Axes {
  readonly variants: readonly VariantSummary[];
  readonly assemblies: readonly PassportAssembly[];
}

/** Списки принадлежат компоненту (`entities/component`), а `axisMode`/`secondaryIndex` — показу
 *  (`model/store.ts`). Свести их вместе может только тот, у кого на руках и то, и другое, поэтому
 *  разрешение «ячейка → показанный элемент» живёт здесь, чистой функцией, а не в сторе: стор
 *  чужих данных у себя не держит, а вид — не место для арифметики. */
function secondaryLengthOf(axes: Axes, axisMode: AxisMode): number {
  return axisMode === "variant" ? axes.assemblies.length : axes.variants.length;
}

/**
 * Хранимый выбор secondary, приведённый к границам списка.
 *
 * Списки приезжают асинхронно и умеют становиться короче уже сделанного выбора. Индекс вне границ
 * — это не исключение, а `undefined` из `variantAt`/`assemblyAt`, на котором `Show` не рисует
 * ничего: ячейка молча пустая, без ошибки и без объяснения. Поэтому наружу уходит только индекс,
 * по которому что-то есть.
 */
export function secondaryIndexIn(
  axes: Axes,
  axisMode: AxisMode,
  stored: number,
): number {
  const length = secondaryLengthOf(axes, axisMode);
  return length === 0 ? 0 : Math.min(stored, length - 1);
}

/** Позиция ячейки по primary-оси — её собственная и неизменная; по secondary — общий хранимый
 *  выбор, приведённый к границам. Какая из осей primary, говорит `axisMode`. */
function indexIn(
  axes: Axes,
  axisMode: AxisMode,
  cell: Cell,
  stored: number,
  axis: AxisMode,
): number {
  return axisMode === axis
    ? cell.primary
    : secondaryIndexIn(axes, axisMode, stored);
}

export function variantIn(
  axes: Axes,
  axisMode: AxisMode,
  cell: Cell,
  stored: number,
): VariantSummary | undefined {
  return axes.variants[indexIn(axes, axisMode, cell, stored, "variant")];
}

export function assemblyIn(
  axes: Axes,
  axisMode: AxisMode,
  cell: Cell,
  stored: number,
): PassportAssembly | undefined {
  return axes.assemblies[indexIn(axes, axisMode, cell, stored, "assembly")];
}
