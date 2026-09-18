import { Show } from "solid-js";
import { TreeForm } from "@web-core/feeder";
import { useComponent } from "#/entities/component";
import { ALL_CELLS, useStandStore } from "../../model";

export function FeedManual() {
  const store = useStandStore();
  const component = useComponent();
  const schema = () => component.io()?.schema;
  const feedData = store.use((state) => state.feedData[ALL_CELLS]);

  return (
    <Show when={schema()} keyed>
      {(schema) => (
        <TreeForm
          schema={schema}
          value={feedData()}
          onChange={(next) => store.actions.setFeedData(next)}
        />
      )}
    </Show>
  );
}
