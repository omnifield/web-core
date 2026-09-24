import { layoutGroup } from "@web-core/skin";
import { Button, Flow, Icon, Typography } from "@web-core/ui";
import { type PlanePlacement, placementStyle } from "./lib/placement";

const ICONS = {
  horizontal: { prev: "chevron-left", next: "chevron-right" },
  vertical: { prev: "chevron-up", next: "chevron-down" },
} as const;

/** Подпись не должна менять ширину от шага к шагу. Для вертикальной линейки это не косметика:
 *  она стоит слева от плоскости, и «дышащая» ширина двигала бы саму плоскость вбок на каждом
 *  шаге по вертикали. Меру берём из данных — самое длинное имя списка, — а не из подобранной
 *  константы, которая разъедется на первом же списке с другими именами. */
function labelWidth(items: readonly { readonly name: string }[]): string {
  const longest = items.reduce(
    (max, item) => Math.max(max, item.name.length),
    0,
  );
  return `${longest}ch`;
}

/**
 * Линейка одной оси: шаг назад, имя текущего элемента, шаг вперёд.
 *
 * Лежит ВДОЛЬ своей оси, и стрелки смотрят по ней же: горизонтальная линейка — влево/вправо,
 * вертикальная — вверх/вниз. Имя между стрелками, а не сбоку: это подпись к тому, что сейчас
 * показано, и читается как часть шкалы.
 *
 * Плоскость не зациклена, поэтому на краях стрелка гаснет, а не уводит по кругу.
 */
export function PlaneRuler(props: {
  orientation: "horizontal" | "vertical";
  items: readonly { readonly name: string }[];
  index: number;
  onSelect: (index: number) => void;
  /** Не задан — линейка стоит в потоке. Задан — лежит поверх плоскости у своего края
   *  (только внутри `PlaneStack`). */
  placement?: PlanePlacement;
}) {
  const icons = () => ICONS[props.orientation];
  const current = () => props.items[props.index];

  function step(delta: number) {
    const next = props.index + delta;
    if (next < 0 || next >= props.items.length) return;
    props.onSelect(next);
  }

  return (
    <Flow
      style={{
        ...layoutGroup({
          direction: props.orientation === "vertical" ? "column" : "row",
          align: "center",
          justify: "center",
        }),
        ...placementStyle(props.placement),
      }}
    >
      <Button
        data-variant="tertiary"
        aria-label="Предыдущий"
        disabled={props.index <= 0}
        onClick={() => step(-1)}
      >
        <Icon name={icons().prev} />
      </Button>

      <Typography
        style={{
          "min-width": labelWidth(props.items),
          "text-align": "center",
        }}
      >
        {current()?.name ?? ""}
      </Typography>

      <Button
        data-variant="tertiary"
        aria-label="Следующий"
        disabled={props.index >= props.items.length - 1}
        onClick={() => step(1)}
      >
        <Icon name={icons().next} />
      </Button>
    </Flow>
  );
}
