import { Show } from "@web-core/solid";
import { Typography } from "@web-core/ui";

/** Показ содержимого объекта. Пока текстом — разбор по полям придёт позже. */
export function ObjectView(props: { data: unknown; empty?: string }) {
  return (
    <Show
      when={props.data !== undefined}
      fallback={<Typography>{props.empty ?? "нет данных"}</Typography>}
    >
      {/* `pre-wrap`: отступы `JSON.stringify` разметка схлопывает, а ячейка узкая — перенос
          лучше горизонтального скролла. */}
      <pre style={{ margin: 0, "white-space": "pre-wrap" }}>
        {JSON.stringify(props.data, null, 2)}
      </pre>
    </Show>
  );
}
