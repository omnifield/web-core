import { Button, Field, FieldLabel, FieldSelect, Flow, Surface, Typography } from "@web-core/ui";
import { createEffect, createSignal, For, onCleanup, Show } from "solid-js";

import {
  bindingBy,
  bindingKey,
  bindingStoreOf,
  type BindingsState,
  type Consumer,
} from "../../entities/binding";
import {
  endpointKey,
  type InvokeResult,
  type OpenapiEndpoint,
} from "../../entities/openapi";
import { invokeEndpoint } from "../../features/invoke-endpoint";
import { TreeForm } from "../../features/tree-form";
import { Mapping } from "../mapping";

const NOT_CHOSEN = "";

/**
 * Одна ручка на экране настройки: настроить параметры → проверить живым вызовом → отдать
 * потребителю и свести поля.
 *
 * Порядок здесь не украшение, а следствие механики: схему ОТВЕТА мы ниоткуда не знаем (Swagger
 * 2.0 разбирается на параметры, не на ответ), значит свести поля можно только по настоящему
 * ответу. Пока «Проверить» не нажали — сводить нечего, и UI это показывает прямо, а не пустым
 * списком полей.
 *
 * Параметры настраиваются тем же `TreeForm` (мод 1) по `endpoint.schema` — второй раз тот же
 * редактор значений здесь не пишется.
 */
export function BindEndpoint(props: {
  apiId: string;
  endpoint: OpenapiEndpoint;
  consumers: readonly Consumer[];
}) {
  const [value, setValue] = createSignal<unknown>({});
  const [result, setResult] = createSignal<InvokeResult>();
  const [failure, setFailure] = createSignal<string>();
  const [checking, setChecking] = createSignal(false);
  const [chosen, setChosen] = createSignal(NOT_CHOSEN);

  const source = () => ({
    apiId: props.apiId,
    endpointId: endpointKey(props.endpoint),
    value: value(),
  });
  const id = () => bindingKey(source());

  // Читаем стор ТОГО потребителя, которого сейчас выбрали, и переподписываемся при смене:
  // привязки у каждого свои, общего стора, из которого можно было бы читать один раз, здесь нет.
  const [state, setState] = createSignal<BindingsState>({ bindings: [] });
  createEffect(() => {
    const name = chosen();
    if (name === NOT_CHOSEN) {
      setState({ bindings: [] });
      return;
    }

    const store = bindingStoreOf(name);
    setState(store.get());
    const subscription = store.subscribe(setState);
    onCleanup(() => subscription.unsubscribe());
  });

  const binding = () => bindingBy(state(), id());
  const consumer = () => props.consumers.find((item) => item.name === chosen());

  async function check() {
    setChecking(true);
    setFailure(undefined);
    try {
      const invocation = await invokeEndpoint(props.endpoint, value());
      setResult(invocation);
      // Параметры могли поменяться с момента привязки — переписываем источник, правила при этом
      // остаются (ручка и форма её ответа те же).
      if (chosen() !== NOT_CHOSEN) bindingStoreOf(chosen()).actions.bind(source());
    } catch (error) {
      setResult(undefined);
      setFailure(error instanceof Error ? error.message : String(error));
    } finally {
      setChecking(false);
    }
  }

  function choose(name: string) {
    setChosen(name);
    if (name !== NOT_CHOSEN) bindingStoreOf(name).actions.bind(source());
  }

  return (
    <Surface>
      <TreeForm schema={props.endpoint.schema} value={value()} onChange={setValue} />

      <Flow>
        <Button onClick={() => void check()} disabled={checking()}>
          {checking() ? "Проверяем…" : "Проверить"}
        </Button>
        <Show when={result()}>
          {(invocation) => <Typography>Ответ: {invocation().status}</Typography>}
        </Show>
        <Show when={failure()}>
          {(message) => <Typography>Ручка не ответила: {message()}</Typography>}
        </Show>
      </Flow>

      <Field>
        <FieldLabel>Кому отдать</FieldLabel>
        <FieldSelect value={chosen()} onChange={(event) => choose(event.currentTarget.value)}>
          <option value={NOT_CHOSEN}>— не привязано —</option>
          <For each={props.consumers}>
            {(item) => <option value={item.name}>{item.name}</option>}
          </For>
        </FieldSelect>
      </Field>

      <Show when={chosen() !== NOT_CHOSEN}>
        <Show
          when={result()?.ok === true}
          fallback={
            <Typography>
              Чтобы свести поля, нужен настоящий ответ — нажмите «Проверить»
            </Typography>
          }
        >
          <Mapping
            source={result()?.body}
            target={consumer()?.input}
            root={binding()?.root}
            rules={binding()?.rules}
            onChange={(change) => {
              const actions = bindingStoreOf(chosen()).actions;
              actions.setRoot(id(), change.root);
              actions.setRules(id(), change.rules);
            }}
          />
        </Show>
      </Show>
    </Surface>
  );
}
