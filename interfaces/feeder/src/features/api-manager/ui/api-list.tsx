import { For, Match, Switch, type JSX } from "solid-js";
import { Flow, Surface, Typography } from "@web-core/ui";

import type { OpenapiEndpoint } from "../../../entities/openapi";
import { useApiCatalog } from "../models";

/**
 * Список ручек ТЕКУЩЕГО API (того, что назван в `ApiManagerProvider`).
 *
 * Что монтируется на строку — решает тот, кто собирает экран: сам список знает только состав
 * каталога и его состояния, а не то, что с ручкой собираются делать (привязать, вызвать,
 * удалить). Поэтому действие приходит функцией-ребёнком, а не зашито здесь.
 */
export function ApiList(props: { children?: (endpoint: OpenapiEndpoint) => JSX.Element }) {
  const catalog = useApiCatalog();
  const state = catalog.use();

  return (
    <Surface>
      <Switch>
        <Match when={state().status === "loading"}>
          <Typography>Распознаём схему…</Typography>
        </Match>
        <Match when={state().status === "failed"}>
          <Typography>Схема не распозналась: {state().error}</Typography>
        </Match>
        <Match when={state().endpoints.length === 0}>
          <Typography>Ручек пока нет — загрузите схему или заведите ручку вручную</Typography>
        </Match>
        <Match when={state().endpoints.length > 0}>
          <For each={state().endpoints}>
            {(endpoint) => (
              <Flow>
                <Typography>{endpoint.method}</Typography>
                <Typography>{endpoint.url}</Typography>
                {props.children?.(endpoint)}
              </Flow>
            )}
          </For>
        </Match>
      </Switch>
    </Surface>
  );
}
