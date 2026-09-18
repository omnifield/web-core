import type { IconProps } from "@web-core/ui";

type IconName = IconProps["name"];

export type ViewMode = "style" | "assembly" | "feed" | "form";
export const VIEW_MODES: readonly {
  readonly value: ViewMode;
  readonly icon: IconName;
}[] = [
  { value: "style", icon: "image" },
  { value: "assembly", icon: "folder" },
  { value: "feed", icon: "file-text" },
  { value: "form", icon: "pencil" },
];

export type LayoutMode = "matrix" | "grid";
export const LAYOUT_MODES: readonly {
  readonly value: LayoutMode;
  readonly icon: IconName;
}[] = [
  { value: "matrix", icon: "layout-grid" },
  { value: "grid", icon: "grid-3x3" },
];
export const DEFAULT_LAYOUT_MODE: LayoutMode = "grid";

export type FilterMode = "none" | "tags";
export const FILTER_MODES: readonly {
  readonly value: FilterMode;
  readonly icon: IconName;
  /** Оси, на которых фильтр осмыслен. Теги есть только у вариантов (`VariantSummary.tags`); у
   *  сборок такого поля нет и не предвидится — это другая сущность, а не недоделка скина.
   *  Поэтому применимость объявлена здесь, рядом с самим режимом, а не выводится по месту: иначе
   *  контрол предлагает кнопку, которая на этой оси гарантированно ничего не делает. */
  readonly axes: readonly AxisMode[];
}[] = [
  { value: "none", icon: "folder-open", axes: ["variant", "assembly"] },
  { value: "tags", icon: "folder", axes: ["variant"] },
];
export const DEFAULT_FILTER_MODE: FilterMode = "none";

export function filterAppliesTo(
  filterMode: FilterMode,
  axisMode: AxisMode,
): boolean {
  const mode = FILTER_MODES.find((item) => item.value === filterMode);
  return mode !== undefined && mode.axes.includes(axisMode);
}

export type AxisMode = "variant" | "assembly";
export const AXIS_MODES: readonly {
  readonly value: AxisMode;
  readonly icon: IconName;
}[] = [
  { value: "variant", icon: "copy" },
  { value: "assembly", icon: "folder" },
];
export const DEFAULT_AXIS_MODE: AxisMode = "variant";
