import { Show } from "solid-js";
import { TreeForm } from "@web-core/feeder";
import { useStand } from "../../model";

export function FeedManual() {
  const { store, component, standFeedData } = useStand();
  const schema = () => component.io()?.schema;

  return (
    <Show when={schema()} keyed>
      {(schema) => (
        <TreeForm
          schema={schema}
          value={standFeedData()}
          onChange={(next) => store.actions.setFeedData(next)}
        />
      )}
    </Show>
  );
}
