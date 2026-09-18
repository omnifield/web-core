import { Match, Show, Switch } from "solid-js";
import type { Cell } from "../../../lib/cell";
import { useStand } from "../../../model";
import { Assembly } from "./assembly";
import { Feed } from "./feed";
import { Form } from "./form";
import { Style } from "./style";

export function Switcher(props: { cell: Cell }) {
  const { store, variantOf, assemblyOf } = useStand();

  const mode = () => store.selectors.viewMode(props.cell);
  const variant = () => variantOf(props.cell);
  const assembly = () => assemblyOf(props.cell);

  return (
    <Switch>
      <Match when={mode() === "form"}>
        <Show when={variant()} keyed>
          {(variant) => (
            <Show when={assembly()} keyed>
              {(assembly) => (
                <Form cell={props.cell} variant={variant.name} assembly={assembly} />
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
        <Feed feedData={store.selectors.feedData(props.cell)} />
      </Match>
      <Match when={mode() === "style"}>
        <Style styleData={undefined} />
      </Match>
    </Switch>
  );
}
