import {
  apiCatalogOf,
  type EndpointParam,
  type HttpMethod,
} from "@web-core/feeder";
import {
  Button,
  Field,
  FieldInput,
  FieldLabel,
  FieldSelect,
  Flow,
  Surface,
  Typography,
} from "@web-core/ui";
import { createSignal, For, Show } from "solid-js";

/** Список методов у движка есть (`HTTP_METHODS`), но наружу он не экспортирован — здесь свой
 *  перечень, а тип общий: разъехаться молча он не сможет, лишний метод не пройдёт типизацию. */
const METHODS: readonly HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const PARAM_TYPES: readonly EndpointParam["type"][] = ["string", "number", "boolean"];

/**
 * «Завести ручку самому» — второй способ наполнить каталог, наравне со схемой: метод, урл и
 * параметры, из которых движок сам соберёт zod-схему вызова (`descriptorToEndpoint`).
 *
 * Пишем сразу в каталог (`addEndpoint`), а не наружу пропом: каталог ручек — стор-семья по айди
 * API, он и есть единственное место, где ручка живёт; промежуточная копия в состоянии этой формы
 * расходилась бы с ним при первой же загрузке схемы.
 *
 * Про `in: query/path` спрашивать нечего: имя, встреченное в `{плейсхолдере}` урла, уходит в путь,
 * остальные — в квери (так решает `invokeEndpoint`).
 */
export function EndpointForm(props: { api: string }) {
  const [method, setMethod] = createSignal<HttpMethod>("GET");
  const [url, setUrl] = createSignal("");
  const [params, setParams] = createSignal<readonly EndpointParam[]>([]);
  const [added, setAdded] = createSignal<string>();

  function patch(at: number, change: Partial<EndpointParam>) {
    setParams((list) =>
      list.map((param, index) => (index === at ? { ...param, ...change } : param)),
    );
  }

  function submit() {
    const address = url().trim();
    if (address === "") return;

    // Безымянный параметр в схему не положить — она собирается объектом по именам. Пустые строки
    // здесь не отказ формы, а просто не заполненная до конца строка: выкидываем её.
    const named = params()
      .map((param) => ({ ...param, name: param.name.trim() }))
      .filter((param) => param.name !== "");

    apiCatalogOf(props.api).actions.addEndpoint({
      method: method(),
      url: address,
      params: named,
    });

    setAdded(`${method()} ${address}`);
    setUrl("");
    setParams([]);
  }

  return (
    <Surface>
      <Typography>Ручка вручную</Typography>

      <Flow>
        <Field>
          <FieldLabel>Метод</FieldLabel>
          <FieldSelect
            value={method()}
            onChange={(event) => setMethod(event.currentTarget.value as HttpMethod)}
          >
            <For each={METHODS}>{(item) => <option value={item}>{item}</option>}</For>
          </FieldSelect>
        </Field>
        <Field>
          <FieldLabel>Урл</FieldLabel>
          <FieldInput
            placeholder="https://my.back/users/{id}"
            value={url()}
            onInput={(event) => setUrl(event.currentTarget.value)}
          />
        </Field>
      </Flow>

      <For each={params()}>
        {(param, index) => (
          <Flow>
            <Field>
              <FieldInput
                placeholder="имя параметра"
                value={param.name}
                onInput={(event) => patch(index(), { name: event.currentTarget.value })}
              />
            </Field>
            <Field>
              <FieldSelect
                value={param.type}
                onChange={(event) =>
                  patch(index(), {
                    type: event.currentTarget.value as EndpointParam["type"],
                  })
                }
              >
                <For each={PARAM_TYPES}>{(item) => <option value={item}>{item}</option>}</For>
              </FieldSelect>
            </Field>
            <Field>
              <FieldSelect
                value={param.required ? "yes" : "no"}
                onChange={(event) =>
                  patch(index(), { required: event.currentTarget.value === "yes" })
                }
              >
                <option value="no">необязательный</option>
                <option value="yes">обязательный</option>
              </FieldSelect>
            </Field>
            <Button
              onClick={() =>
                setParams((list) => list.filter((_, at) => at !== index()))
              }
            >
              Убрать
            </Button>
          </Flow>
        )}
      </For>

      <Flow>
        <Button
          onClick={() =>
            setParams((list) => [...list, { name: "", type: "string", required: false }])
          }
        >
          Параметр
        </Button>
        <Button disabled={url().trim() === ""} onClick={submit}>
          Завести ручку
        </Button>
        <Show when={added()}>
          {(name) => <Typography>Завели: {name()}</Typography>}
        </Show>
      </Flow>
    </Surface>
  );
}
