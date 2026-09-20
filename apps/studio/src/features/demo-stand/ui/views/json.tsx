import { Show } from "solid-js";
import { Typography } from "@web-core/ui";

/** Показ произвольных данных как JSON — общий для всех видов, которые пока просто вываливают то,
 *  что у них есть (`feed`, `style`, `assembly`).
 *
 *  `<pre>` здесь не украшение. `JSON.stringify(data, null, 2)` расставляет отступы и переводы
 *  строк, а HTML их схлопывает: в обычном `<div>` третий аргумент выброшен, и на экране одна
 *  строка каши. `pre-wrap` вместо `pre` — потому что ячейка узкая и с `overflow-y: auto`
 *  (`cellSize`): длинную строку лучше перенести, чем увести в горизонтальный скролл.
 *
 *  `undefined` показывается словами, а не подписью `undefined`: отсутствие данных — это состояние
 *  вида, а не их содержимое. */
export function Json(props: { data: unknown; empty?: string }) {
  return (
    <Show
      when={props.data !== undefined}
      fallback={<Typography>{props.empty ?? "нет данных"}</Typography>}
    >
      <pre style={{ margin: 0, "white-space": "pre-wrap" }}>
        {JSON.stringify(props.data, null, 2)}
      </pre>
    </Show>
  );
}
