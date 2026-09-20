import { Match, Show, Switch } from "solid-js";
import { useFeed } from "#/entities/feed";
import type { Cell } from "../../lib/cell";
import { usePreview } from "../../model";
import { Assembly } from "./assembly";
import { Feed } from "./feed";
import { Form } from "./form";
import { Style } from "./style";

export function Switcher(props: { cell: Cell; secondary?: number }) {
  const { store, variantOf, assemblyOf } = usePreview();
  const feed = useFeed();

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
          {(assembly) => <Assembly assembly={assembly} />}
        </Show>
      </Match>
      <Match when={mode() === "feed"}>
        <Feed feedData={feed.data()} />
      </Match>
      <Match when={mode() === "style"}>
        <Style styleData={undefined} />
      </Match>
    </Switch>
  );
}
