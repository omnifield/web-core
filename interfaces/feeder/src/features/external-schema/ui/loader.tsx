import { Flow, FlowItem } from "@web-core/ui";
import { createSignal } from "solid-js";

import { SchemaInfo, SchemaLoader, schemasStore } from "../../../entities/schema";

export function ExternalSchemaLoader() {
  const [name, setName] = createSignal("");

  const title = () => name().trim();

  return (
    <Flow data-variant="column">
      <FlowItem>
        <SchemaInfo name={name()} onName={setName} />
      </FlowItem>
      <FlowItem>
        <SchemaLoader
          disabled={title() === ""}
          onPick={(fileName) => {
            if (title() === "") setName(fileName);
          }}
          onLoad={(raw) => {
            schemasStore.actions.add(title(), raw);
            setName("");
          }}
        />
      </FlowItem>
    </Flow>
  );
}
