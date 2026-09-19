import {
  Flow,
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaViewport,
} from "@web-core/ui";
import { ApiConfiguration } from "#/features/lab-manager";

/** Форма `omnifield-scroll-area` держит в базе `height: 12rem` — это рост стенда, а не рейла.
 *  Здесь область прокрутки занимает блок целиком, поэтому высота переопределяется на месте.
 *  `min-block-size: 0` рядом обязателен: без него вьюпорт растёт под содержимым, прокрутке
 *  нечего резать, и ползунок не появляется вовсе. */
const fillBlock = { "block-size": "100%", "min-block-size": "0" };

/** Ark кладёт на `content` свой `min-width: fit-content` — и это ровно то, из-за чего панель
 *  растягивалась вширь: содержимое переставало считаться с шириной рейла и просило свою
 *  «естественную», а вьюпорт отвечал горизонтальной полосой. Сбрасываем минимум в ноль и держим
 *  содержимое по ширине места: ширину диктует рейл, а не то, что в него положили. */
const noStretch = { "inline-size": "100%", "min-inline-size": "0" };

/** Блок правого рейла под фичу «API». Своей логики нет — блок про МЕСТО: он даёт фиче поверхность
 *  в рейле, а имя фичи и переключение между фичами появятся здесь же, когда фич станет больше.
 *
 *  Вариант `plain`, а не дефолтный `framed`: рейл уже отбит от рабочей области рамкой самого
 *  `Workspace`, и вторая рамка внутри читалась бы как ещё один слой вложенности. */
export function Api() {
  return (
    <Flow data-variant="column" style={fillBlock}>
      <ScrollArea data-variant="plain" style={fillBlock}>
        <ScrollAreaViewport style={noStretch}>
          <ScrollAreaContent style={noStretch}>
            <ApiConfiguration />
          </ScrollAreaContent>
        </ScrollAreaViewport>
        <ScrollAreaScrollbar orientation="vertical">
          {/* <ScrollAreaThumb /> */}
        </ScrollAreaScrollbar>
      </ScrollArea>
    </Flow>
  );
}
