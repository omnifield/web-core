import { splitProps } from "@web-core/solid";

// Служебные пропы разборщика документа: узел разбора, его ключ, позиция в источнике и подсказки
// про сам узел. В разметку кита они не едут — разбор в `FAQ.md` зоны.
const RENDERER_PROPS = [
  "node",
  "key",
  "sourcePosition",
  "index",
  "siblingCount",
  "level",
  "inline",
  "ordered",
  "depth",
  "isHeader",
  "checked",
] as const;

export function dropRendererProps<P extends object>(props: P): P {
  const [, rest] = splitProps(
    props as P & Record<(typeof RENDERER_PROPS)[number], unknown>,
    [...RENDERER_PROPS],
  );

  return rest as P;
}
