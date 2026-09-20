import { Show } from "solid-js";
import { TreeForm } from "@web-core/feeder";
import { usePreview } from "../../model";

export function FeedManual() {
  const { store, component, previewFeedData } = usePreview();
  const schema = () => component.io()?.schema;

  return (
    <Show when={schema()} keyed>
      {(schema) => (
        <TreeForm
          schema={schema}
          value={previewFeedData()}
          onChange={(next) => store.actions.setFeedData(next)}
        />
      )}
    </Show>
  );
}
