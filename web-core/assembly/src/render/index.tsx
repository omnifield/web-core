// Тонкий реэкспорт публичной поверхности `./render` — что лежит в каждом файле отрисовки,
// перечисляет README.md («Анатомия»), почему их много — FAQ.md.

export type { SlotEntry, SlotPlacement } from "./types.js";
export type { FallbackProps, ErrorFallbackProps, EditOverlayProps, RenderTreeProps } from "./types.js";
export { RenderTree } from "./render-tree.js";
