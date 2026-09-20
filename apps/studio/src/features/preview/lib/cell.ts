import type { NativeStyle } from "@web-core/skin";
import type { ComponentFootprint } from "@web-core/skin/editor";

/** Ячейка адресуется парой «группа + позиция», отдельного `id` у неё нет намеренно: его пришлось
 *  бы держать уникальным вручную на стороне производителя ячеек, а тот про соседние группы не
 *  знает — один вариант с двумя тегами рождается в двух группах, и «уникальный» id у них выходил
 *  общий. Ключ выводится из самой ячейки (`cellKeyOf` в `model/store.ts`), промахнуться негде. */
export interface Cell {
  /** Позиция по primary-оси — уникальна ВНУТРИ группы и зашита в момент создания ячейки. */
  readonly primary: number;

  /** Ключ группы (порции primary-оси после фильтра), "" — без группировки. Задаёт scope
   *  для secondary в matrix — там secondary общий на всю группу, не per-cell. */
  readonly group: string;
}

const CELL_SIZES = {
  compact: { height: "16rem", "overflow-y": "auto" },
  regular: { height: "24rem", "overflow-y": "auto" },
  wide: { height: "32rem", "overflow-y": "auto" },
} as const satisfies Record<ComponentFootprint, NativeStyle>;

export function cellSize(footprint?: ComponentFootprint): NativeStyle {
  return CELL_SIZES[footprint ? footprint : "compact"];
}
