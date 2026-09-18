import { For } from "solid-js";
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";

/**
 * Линейка одной оси: по делению на элемент, текущее отмечено, клик — переход.
 *
 * Лежит ВДОЛЬ своей оси — горизонтальная сверху, вертикальная слева, — поэтому отметка всегда
 * напротив того, что под ней (или рядом с ней) показано. Это и есть та самая «параллельность»:
 * линейка читается как шкала плоскости, а не как отдельный пульт сбоку.
 *
 * Собрана из `SegmentGroup`, а не из карусельных индикаторов: карусели под плоскостью больше
 * нет, а выбор одного из многих — ровно то, чем `SegmentGroup` и является, вместе с клавиатурой
 * и ролями. Подписи именами, а не точками: в витрине важно видеть, КАКОЙ вариант или сборка
 * сейчас на экране.
 */
export function Ruler(props: {
  orientation: "horizontal" | "vertical";
  items: readonly { readonly name: string }[];
  index: number;
  onSelect: (index: number) => void;
}) {
  return (
    <SegmentGroup
      orientation={props.orientation}
      value={String(props.index)}
      onValueChange={(details) => {
        if (details.value) props.onSelect(Number(details.value));
      }}
    >
      <SegmentGroupIndicator />
      <For each={props.items}>
        {(item, index) => (
          <SegmentGroupItem value={String(index())}>
            <SegmentGroupItemControl />
            <SegmentGroupItemText>{item.name}</SegmentGroupItemText>
          </SegmentGroupItem>
        )}
      </For>
    </SegmentGroup>
  );
}
