import type { JSX } from "solid-js";
import { spaceVar } from "@web-core/skin";
import {
  Flow,
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaViewport,
} from "@web-core/ui";

/** Форма `omnifield-scroll-area` держит в базе `height: 12rem` — это рост показа, а не рейла.
 *  Здесь область прокрутки занимает блок целиком, поэтому высота переопределяется на месте.
 *  `min-block-size: 0` рядом обязателен: без него вьюпорт растёт под содержимым, прокрутке
 *  нечего резать, и ползунок не появляется вовсе. */
const fillBlock = { "block-size": "100%", "min-block-size": "0" };

/** Ark кладёт на `content` свой `min-width: fit-content` — и это ровно то, из-за чего панель
 *  растягивалась вширь: содержимое переставало считаться с шириной рейла и просило свою
 *  «естественную», а вьюпорт отвечал горизонтальной полосой. Сбрасываем минимум в ноль и держим
 *  содержимое по ширине места: ширину диктует рейл, а не то, что в него положили. */
const noStretch = { "inline-size": "100%", "min-inline-size": "0" };

/** Отступ содержимого держит сама поверхность, а не рейл снаружи: иначе полоса прокрутки
 *  оказывается внутри отступа и отъезжает от края. Из двух прежних копий отступ был только у
 *  одной — у панели витрины, и приходил он от `WorkspaceRightbar`; сведение выбирает одно. */
const inset = { padding: spaceVar("space-3") };

/**
 * Поверхность бокового рейла: место под панель, которое само прокручивается.
 *
 * Виджет называет МЕСТО, а не хозяина, и потому не знает ни одной фичи и ни одной сущности
 * приложения — что в него положили, решает страница. До этого поверхность была написана дважды
 * под двумя именами: блок под фичу «API» в лаборатории и панель управления в витрине.
 *
 * Вариант `plain`, а не дефолтный `framed`: рейл уже отбит от рабочей области рамкой самого
 * `Workspace`, и вторая рамка внутри читалась бы как ещё один слой вложенности.
 */
export function RailPanel(props: { children: JSX.Element }) {
  return (
    <Flow data-variant="column" style={fillBlock}>
      <ScrollArea data-variant="plain" style={fillBlock}>
        <ScrollAreaViewport style={noStretch}>
          <ScrollAreaContent style={{ ...noStretch, ...inset }}>
            {props.children}
          </ScrollAreaContent>
        </ScrollAreaViewport>
        <ScrollAreaScrollbar orientation="vertical" />
      </ScrollArea>
    </Flow>
  );
}
