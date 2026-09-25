import { Show } from "@web-core/solid";
import { Markdown, Typography } from "@web-core/ui";

/** Показ документа разметкой кита: текст приходит готовым, разбор и вид держит сам компонент. */
export function MarkdownView(props: { text?: string; empty?: string }) {
  return (
    <Show
      when={props.text}
      fallback={<Typography>{props.empty ?? "документа нет"}</Typography>}
    >
      {(text) => <Markdown text={text()} />}
    </Show>
  );
}
