import { Match, Show, Switch } from "@web-core/solid";
import { useFeed } from "#/entities/feed";
import type { Cell } from "../../lib/cell";
import { usePreview } from "../../use";
import { Data } from "./data";
import { Form } from "./form";

export function Switcher(props: { cell: Cell; secondary?: number }) {
  const { component, store, variantOf, assemblyOf } = usePreview();
  const feed = useFeed(component.name);

  const mode = () => store.selectors.viewMode(props.cell);
  const variant = () => variantOf(props.cell, props.secondary);
  const assembly = () => assemblyOf(props.cell, props.secondary);

  return (
    <Switch>
      <Match when={mode() === "form"}>
        <Show when={variant()} keyed>
          {(variant) => (
            <Show when={assembly()} keyed>
              {(assembly) => (
                <Form
                  cell={props.cell}
                  variant={variant.name}
                  assembly={assembly}
                />
              )}
            </Show>
          )}
        </Show>
      </Match>
      <Match when={mode() === "assembly"}>
        <Show when={assembly()} keyed>
          {(assembly) => <Data data={assembly} />}
        </Show>
      </Match>
      <Match when={mode() === "feed"}>
        <Data data={feed.data()} empty="данные не заданы" />
      </Match>
      <Match when={mode() === "style"}>
        {/* Источника у этого вида пока нет — ветка названа словами, а не пустотой. */}
        <Data data={undefined} empty="стиль сюда пока не подключён" />
      </Match>
    </Switch>
  );
}
