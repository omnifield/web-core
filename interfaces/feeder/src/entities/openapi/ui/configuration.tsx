import { Flow, Typography } from "@web-core/ui";
import { Match, Switch } from "solid-js";

import { useApiCatalogState } from "../lib";

export function Configuration(props: { api: string }) {
  const state = useApiCatalogState(() => props.api);

  return (
    <Flow>
      <Typography>API: {props.api}</Typography>

      <Switch>
        <Match when={state().status === "loading"}>
          <Typography>Распознаём схему…</Typography>
        </Match>
        <Match when={state().status === "failed"}>
          <Typography>Схема не распозналась: {state().error}</Typography>
        </Match>
        <Match when={state().status === "ready"}>
          <Typography>Ручек в каталоге: {state().endpoints.length}</Typography>
        </Match>
        <Match when={state().status === "idle"}>
          <Typography>Схемы пока нет — вставьте документ и нажмите «Загрузить схему»</Typography>
        </Match>
      </Switch>
    </Flow>
  );
}
