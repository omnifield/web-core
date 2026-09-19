# 🧪 Примеры — как работать с `@web-core/feeder`

Рабочий код, который можно скопировать и сразу погонять. Устройство — [`README.md`](./README.md),
почему так — [`FAQ.md`](./FAQ.md), что запланировано — [`ROADMAP.yaml`](./ROADMAP.yaml).

Всё ниже сверено с экспортами `src/index.ts` на 2026-09-19.

## 🧭 Навигация

**Экран**
- [1. Загрузить документ API и показать каталог](#кейс-1)
- [2. Свой экран вместо `SchemaCatalog`](#кейс-2)

**Склад пресетов**
- [3. Завести пресет кодом, без загрузчика](#кейс-3)
- [4. Править содержимое пресета точечно](#кейс-4)
- [5. Сохранить пресеты наружу и поднять обратно](#кейс-5)

**Ручки**
- [6. Состав ручек без UI — сгруппировать и обойти](#кейс-6)
- [7. Дёрнуть ручку кодом, без экрана](#кейс-7)
- [8. Форма параметров ручки своими руками](#кейс-8)

**Формы**
- [9. Дерево по произвольной зод-схеме (`TreeForm`)](#кейс-9)

**Отладка**
- [10. Документ не распознался — где смотреть](#кейс-10)

---

<h2 id="словарь">0. Словарь</h2>

Четыре слова, которые встречаются дальше в каждом примере.

| Слово | Что это в коде | Чем опознаётся |
| --- | --- | --- |
| **Пресет** | `Preset { id, name, content }` — именованная запись на складе, `content` для склада непрозрачен | `id`, uuid при создании |
| **Документ схемы** | `SchemaDocument { endpoints, defs }` — наш формат API, он и лежит в `content` | — |
| **Ручка** | `EndpointDescriptor { method, url, tag?, params }`, `params[].schema` — JSON Schema | `endpointKey` = `` `${method} ${url}` `` |
| **Адаптер** | `Adapter` — шов «поставщик → потребитель», перекладывает данные в нужную форму | в коде сегодня заготовка, см. `ROADMAP.yaml` |

Зод из документа не хранится — он строится при отрисовке (`endpointOf`) и живёт ровно столько,
сколько нужно форме.

---

<h2 id="кейс-1">1. Загрузить документ API и показать каталог</h2>

Два компонента на весь экран: первый принимает документ, второй показывает, что из него вышло.

```tsx
import { ExternalSchemaLoader, SchemaCatalog } from "@web-core/feeder";

export function ApiScreen() {
  return (
    <>
      <ExternalSchemaLoader />
      <SchemaCatalog />
    </>
  );
}
```

Оба ходят в один и тот же модульный стор пресетов — связывать их пропами не нужно. Загрузчик
принимает файл или вставку, разбирает документ и кладёт пресет; каталог показывает все пресеты,
которые похожи на документ API: теги → ручки → форма параметров с кнопкой «Проверить».

---

<h2 id="кейс-2">2. Свой экран вместо `SchemaCatalog`</h2>

Когда нужен свой порядок или своё содержимое строки — `Endpoints` собирается руками.

```tsx
import {
  asSchemaDocument,
  Endpoints,
  EndpointCall,
  presetsStore,
} from "@web-core/feeder";
import { Show } from "@web-core/solid";
import { Key } from "@web-core/solid/keyed";

export function MyCatalog() {
  const state = presetsStore.use();

  return (
    <Key each={state().presets} by="id">
      {(preset) => (
        <Show when={asSchemaDocument(preset().content)}>
          {(document) => (
            <Endpoints
              label={preset().name}
              endpoints={document().endpoints}
              onRemove={() => presetsStore.actions.remove(preset().id)}
            >
              {(endpoint) => (
                <EndpointCall endpoint={endpoint()} defs={document().defs} />
              )}
            </Endpoints>
          )}
        </Show>
      )}
    </Key>
  );
}
```

Два обязательных момента, иначе экран будет схлопываться на каждой правке:

- список пресетов перебирается `<Key by="id">`, а не `<For>` — разбор в `FAQ.md`, «Списки и
  тождество узла»;
- `children` у `Endpoints` получает **аксессор**, поэтому `endpoint()`, а не `endpoint`.

---

<h2 id="кейс-3">3. Завести пресет кодом, без загрузчика</h2>

```ts
import { parseSchema, presetsStore } from "@web-core/feeder";

const id = presetsStore.actions.add("petstore", await parseSchema(rawSwaggerText));
```

`parseSchema` распознаёт документ шаблоном и отдаёт наш `SchemaDocument`. Сырой текст дальше не
нужен и нигде не хранится — чужой формат разбирается один раз, на входе.

Содержимым пресета может быть что угодно, склад его не проверяет:

```ts
presetsStore.actions.add("мои заметки", { any: "json" });
```

Ручки можно собрать и руками, без документа:

```ts
import { presetsStore, type SchemaDocument } from "@web-core/feeder";

const document: SchemaDocument = {
  endpoints: [
    {
      method: "GET",
      url: "https://back/users/{id}",
      tag: "users",
      params: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
    },
  ],
  defs: {},
};

presetsStore.actions.add("мой бэк", document);
```

---

<h2 id="кейс-4">4. Править содержимое пресета точечно</h2>

`edit` даёт immer-черновик содержимого — менять можно на месте, наружу уйдёт новое значение.

```ts
import { endpointKey, presetsStore, type SchemaDocument } from "@web-core/feeder";

presetsStore.actions.edit<SchemaDocument>(id, (draft) => {
  const gone = endpointKey({ method: "GET", url: "https://back/users/{id}" });
  draft.endpoints = draft.endpoints.filter((one) => endpointKey(one) !== gone);
});
```

Внутри пакета для этого есть готовые `removeEndpoint`/`removeTag` (`entities/openapi/models/edit`),
но наружу они сегодня **не отданы** — снаружи состав правится черновиком, как выше.

Ручки без тега собираются в группу с именем `unknown`.

Остальные действия склада: `rename(id, name)`, `replace(id, content)` (заменить содержимое
целиком), `remove(id)`.

---

<h2 id="кейс-5">5. Сохранить пресеты наружу и поднять обратно</h2>

Пресет — чистый JSON, поэтому сериализуется как есть.

```ts
import { presetsStore } from "@web-core/feeder";

// сохранить
await fetch("/api/presets", {
  method: "POST",
  body: JSON.stringify(presetsStore.get().presets),
});

// поднять при старте приложения
presetsStore.actions.hydrate(await (await fetch("/api/presets")).json());
```

`hydrate` заменяет состав целиком — это подъём сохранённого, а не слияние.

---

<h2 id="кейс-6">6. Состав ручек без UI — сгруппировать и обойти</h2>

```ts
import { asSchemaDocument, endpointKey, groupEndpoints, presetsStore } from "@web-core/feeder";

const document = asSchemaDocument(presetsStore.selectors.presetBy(id)?.content);

for (const group of groupEndpoints(document?.endpoints ?? [])) {
  console.log(group.tag, group.endpoints.map(endpointKey));
}
```

`asSchemaDocument` — это и проверка, и приведение: не похоже на документ API — вернёт `undefined`,
а не бросит. Группы отдаются в порядке первого появления тега, `unknown` всегда последней.

---

<h2 id="кейс-7">7. Дёрнуть ручку кодом, без экрана</h2>

```ts
import { endpointOf, invokeEndpoint } from "@web-core/feeder";

const endpoint = endpointOf(descriptor, document.defs);
const result = await invokeEndpoint(endpoint, { id: 7, limit: 10 });

result.status; // 404 — это РЕЗУЛЬТАТ, не отказ
result.ok;
result.body;
```

Как раскладывается значение: имя, встреченное в `{плейсхолдере}` url, уходит в путь; ключ `body` —
в JSON-тело; всё остальное — в query.

Не-2xx возвращается обычным `InvokeResult`. А вот сорванный транспорт (сети нет, CORS, кривой url)
вылетает исключением — ответа не было вообще, и собирать `InvokeResult` не из чего.

---

<h2 id="кейс-8">8. Форма параметров ручки своими руками</h2>

`EndpointCall` делает это целиком, но если нужен свой вид — из ручки берётся зод, и дальше это
обычная форма.

```tsx
import { endpointOf, TreeForm, useInvoke } from "@web-core/feeder";
import { createSignal } from "@web-core/solid";

export function MyCall(props: { descriptor: EndpointDescriptor; defs: Record<string, SchemaNode> }) {
  const endpoint = () => endpointOf(props.descriptor, props.defs);
  const [value, setValue] = createSignal<unknown>({});
  const invocation = useInvoke(endpoint);

  return (
    <>
      <TreeForm schema={endpoint().schema} value={value()} onChange={setValue} />
      <button disabled={invocation.pending()} onClick={() => void invocation.call(value())}>
        Проверить
      </button>
      <pre>{JSON.stringify(invocation.result()?.body, null, 2)}</pre>
      <p>{invocation.failure()}</p>
    </>
  );
}
```

`useInvoke` держит три сигнала: `result` (последний ответ), `failure` (текст сорванного
транспорта), `pending`. Исключение наружу не выпускает — кладёт в `failure`.

---

<h2 id="кейс-9">9. Дерево по произвольной зод-схеме</h2>

`TreeForm` к API отношения не имеет — это форма по любой зод-схеме, полностью контролируемая.

```tsx
import { TreeForm } from "@web-core/feeder";
import { z } from "@web-core/io";
import { createSignal } from "@web-core/solid";

const schema = z.object({
  title: z.string(),
  done: z.boolean(),
  tags: z.array(z.object({ value: z.string() })),
});

export function Demo() {
  const [value, setValue] = createSignal<unknown>({});
  return <TreeForm schema={schema} value={value()} onChange={setValue} />;
}
```

Виды полей ровно пять — `string`, `number`, `boolean`, `enum` (выпадающий список), `list`. Вложенный
объект отдельным видом не рисуется: `fieldsOf` раскладывает его в плоские поля с путём, а вложенность
на экране появляется только у списков — элемент списка разворачивается своим поддеревом.

Новый элемент списка встаёт **первым** — заполнять начинают сверху.

---

<h2 id="кейс-10">10. Документ не распознался — где смотреть</h2>

| Что видно | Почему | Куда смотреть |
| --- | --- | --- |
| «Схема не распозналась» под загрузчиком | ни один шаблон не подошёл; сегодня их один — Swagger 2.0, и совпадение жёсткое (`swagger: "2.0"`) | текст ошибки под полем |
| Пресет завёлся, но каталог пишет «не похож на схему API» | `content` не прошёл `asSchemaDocument` — нет массива `endpoints` или элементы без `method`/`url`/`params` | `asSchemaDocument(preset.content)` в консоли |
| Ручка есть, а параметров в форме нет | у ручки пустой `params` — документ их не объявил | `endpointOf(descriptor, defs).schema` |
| Параметр есть, а поле не рисуется | `$ref` указывает в `defs`, которого нет — неизвестная ссылка становится `z.unknown()` | `document.defs` |
| Вызов молча ничего не вернул | сорванный транспорт — это исключение; `useInvoke` кладёт его текст в `failure()` | `invocation.failure()` |
