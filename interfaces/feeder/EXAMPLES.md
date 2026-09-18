# 🧪 Примеры — как работать с `@web-core/feeder`

Рабочий код, который можно скопировать и сразу погонять. Архитектура и решения —
[`README.md`](./README.md) / [`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml).

Всё, что ниже, соответствует коду на 2026-09-18. Примеры под снесённый API (`OpenapiEditor`,
`OpenapiList`, `Mapping a/b`, `Tree` как экспорт пакета) убраны — этих экспортов больше нет.

## 🧭 Навигация

**Основной путь**
- [0. Словарь: четыре слова, которыми всё описывается](#словарь)
- [1. Экран настройки: схема → ручки → привязка к компоненту](#кейс-1)
- [2. Витрина: компонент забирает свою еду](#кейс-2)
- [3. Оба экрана в одном приложении — полный цикл](#кейс-3)

**Каталог ручек**
- [4. Ручки без сваггера — завести руками](#кейс-4)
- [5. Своя сборка экрана вместо `BindingEditor`](#кейс-5)

**Привязка и адаптер**
- [6. Одна ручка — два компонента с разными правилами](#кейс-6)
- [7. Сохранить привязки на бэк и поднять обратно](#кейс-7)
- [8. Сведение само по себе, без API](#кейс-8)

**Без UI**
- [9. Headless: дёрнуть ручку и применить привязку кодом](#кейс-9)
- [10. Дерево по зод-схеме (`TreeForm`)](#кейс-10)

**Отладка**
- [11. На витрине пусто — где смотреть](#кейс-11)
- [12. Подключить в `apps/studio` для живой пробы](#кейс-12)

---

<h2 id="словарь">0. Словарь: четыре слова, которыми всё описывается</h2>

Дальше эти слова встречаются в каждом примере — стоит прочитать один раз.

| Слово | Что это в коде | Чем идентифицируется |
| --- | --- | --- |
| **API** | один бэк со своим набором ручек, `apiCatalogOf(apiId)` | `apiId` — строка, её придумывает приложение (`"main"`, `"billing"`) |
| **Ручка** | `OpenapiEndpoint` — метод, url, zod-схема ПАРАМЕТРОВ | `endpointKey(endpoint)` = `` `${method} ${url}` `` |
| **Потребитель** | `Consumer { name, input }` — компонент и форма его входа | `name` — имя компонента (`"Table"`) |
| **Привязка** | `Binding { source, root, rules }` — она же адаптер | `bindingKey(source)` = `` `${apiId} ${endpointId}` `` |

Главное про привязку: **`rules` — это и есть адаптер**, отдельной сущности «адаптер» нет.
`rules: []` — законное состояние «привязано, но не сведено»: ручку выбрали, поля ещё нет
(проверяется `isFed(binding)`).

Привязка — чистый JSON: на ручку она ссылается строкой, а не объектом, поэтому её можно сохранить
на бэк и поднять обратно (кейс 7).

---

<h2 id="кейс-1">1. Экран настройки: схема → ручки → привязка к компоненту</h2>

Один компонент на весь экран. Грузит документ, показывает ручки, на каждой — путь «настроить
параметры → Проверить → выбрать потребителя → свести поля».

```tsx
import { BindingEditor, type Consumer } from "@web-core/feeder";
import { z } from "@web-core/io";

const swagger = `
swagger: "2.0"
host: jsonplaceholder.typicode.com
schemes: [https]
paths:
  /todos:
    get:
      tags: [todos]
      parameters:
        - { name: _limit, in: query, required: false, type: integer }
      responses: { "200": { description: ok } }
`;

// Форму входа приносит приложение — движок не знает, какие компоненты у вас есть.
const consumers: Consumer[] = [
  { name: "Table", input: z.object({ title: z.string(), done: z.boolean() }) },
  { name: "ListBox", input: z.object({ value: z.number(), text: z.string() }) },
];

export function ApiSettingsPage() {
  return <BindingEditor api="main" raw={swagger} consumers={consumers} />;
}
```

**Что делает юзер на экране, по шагам:**

1. видит список распознанных ручек (`GET https://jsonplaceholder.typicode.com/todos`);
2. заполняет параметры — это `TreeForm` по `endpoint.schema` (`_limit` → число);
3. жмёт **«Проверить»** — уходит настоящий HTTP-запрос, рядом появляется `Ответ: 200`;
4. выбирает в «Кому отдать» — `Table`. В этот момент привязка уже создана, но ещё без адаптера;
5. выбирает «Где в ответе записи» — `""` (весь ответ) или предложенный путь вроде `/data/items`;
6. на каждое поле `Table` выбирает путь из записи ответа. Каждый пик сразу пишется в стор.

**Почему «Проверить» обязателен до сведения:** схему **ответа** движок ниоткуда не знает —
Swagger 2.0 здесь разбирается на параметры, не на ответ. Пути слева берутся из настоящего тела
ответа, поэтому до вызова экран честно говорит «нужен настоящий ответ», а не показывает пустой
список полей.

**Если документа нет** — не передавайте `raw`, наполняйте каталог руками (кейс 4).

---

<h2 id="кейс-2">2. Витрина: компонент забирает свою еду</h2>

Другая страница, другой экран. Компонент называет себя — получает данные уже в форме своего входа.
Про API, ручки и правила он не знает ничего.

```tsx
import { useFeed } from "@web-core/feeder";
import { For, Show } from "solid-js";

export function TableShowcase() {
  const { feed, refetch } = useFeed("Table");

  return (
    <Show when={feed()} fallback={<span>Грузим…</span>}>
      {(result) => (
        <>
          <Show when={result().error}>{(message) => <span>{message()}</span>}</Show>
          <For each={result().rows}>{(row) => <div>{String(row.title)}</div>}</For>
          <button onClick={refetch}>Обновить</button>
        </>
      )}
    </Show>
  );
}
```

Что важно знать про `useFeed`:

- **привязки нет — в сеть не ходим вообще**, `feed()` остаётся `undefined` (ресурс не стреляет);
- исход всегда один и тот же `RowsResult` — `{ rows, report, error }`. И на успехе, и на «ручки
  нет в каталоге», и на 500, и на оборванной сети. Исключение наружу не выходит;
- если привязок несколько, берётся первая **сведённая** (`isFed`), иначе первая вообще — чтобы
  недоделанная привязка объяснила себя, а не притворилась отсутствием еды.

⚠️ Витрина читает тот же каталог `apiCatalogOf(apiId)`, что и экран настройки. Если приложение
перезагрузилось и схему на витрине никто не загрузил, ручки в каталоге нет — `feed()?.error`
скажет об этом прямо. Чем это лечится — кейс 7.

---

<h2 id="кейс-3">3. Оба экрана в одном приложении — полный цикл</h2>

```tsx
import { BindingEditor, apiCatalogOf, useFeed, type Consumer } from "@web-core/feeder";
import { z } from "@web-core/io";

const API = "main";
const consumers: Consumer[] = [
  { name: "Table", input: z.object({ title: z.string() }) },
];

// Страница 1 — настройки.
export function SettingsPage() {
  return <BindingEditor api={API} raw={swagger} consumers={consumers} />;
}

// Страница 2 — витрина.
export function ShowcasePage() {
  const { feed } = useFeed("Table");
  return <pre>{JSON.stringify(feed()?.rows, null, 2)}</pre>;
}

// Общий корень приложения: каталог наполняется один раз, обе страницы видят один и тот же.
export function App() {
  void apiCatalogOf(API).actions.loadSchema(swagger);
  return <Router />;
}
```

Семьи сторов (`apiCatalogOf`, `bindingStoreOf`) — модульные синглтоны: один и тот же ключ на любой
странице даёт один и тот же стор. Провайдер не нужен, чтобы читать их, — он нужен, чтобы UI внутри
него знал, **с каким** API работает (кейс 5).

Между перезагрузками страницы стор ничего не хранит — это забота приложения (кейс 7).

---

<h2 id="кейс-4">4. Ручки без сваггера — завести руками</h2>

Бэк без документа. Ручка описывается дескриптором (`EndpointDescriptor`), движок превращает его в
такую же `OpenapiEndpoint`, что и распознанная из сваггера, — дальше разницы в происхождении нет.

```tsx
import { apiCatalogOf } from "@web-core/feeder";

const catalog = apiCatalogOf("manual-back");

catalog.actions.addEndpoint({
  method: "GET",
  url: "https://my.back/users/{id}",
  params: [
    { name: "id", type: "number", required: true },     // встретится в {id} url → путь
    { name: "verbose", type: "boolean", required: false }, // не встретится → квери
  ],
});
```

`path` и `query` дескриптор не различает отдельным полем: имя, встреченное в `{плейсхолдере}` url,
уходит в путь, остальные — в квери, имя `body` — JSON-телом. Типы параметра — `string | number |
boolean`; `headers`/`enum`/`array` пока не поддержаны (разбор — FAQ.md).

Повторный `addEndpoint` с тем же методом и url **заменяет** ручку, а не двоит её: айди ручки —
метод+url.

Дать юзеру завести ручку самому можно тем же деревом: схема дескриптора (`endpointDescriptorSchema`
— `method`/`url`/`params[]`) уже написана и лежит в `entities/openapi/models/schema.ts`. Наружу
пакета она сегодня **не выставлена** — когда такой экран понадобится, это одна строка в
`src/index.ts`, после чего:

```tsx
<TreeForm schema={endpointDescriptorSchema} value={draft()} onChange={setDraft} />
// дальше готовый дескриптор уходит в catalog.actions.addEndpoint(draft())
```

---

<h2 id="кейс-5">5. Своя сборка экрана вместо `BindingEditor`</h2>

`BindingEditor` — просто сборка провайдера, списка и карточки. Если нужен свой экран (другой
порядок, свои кнопки, своя шапка) — собирается из тех же кусков.

```tsx
import {
  ApiList,
  ApiManagerProvider,
  BindEndpoint,
  endpointKey,
  useApiCatalog,
  type Consumer,
  type OpenapiEndpoint,
} from "@web-core/feeder";

function Toolbar() {
  const catalog = useApiCatalog();              // каталог того API, что назван в провайдере
  const state = catalog.use();

  return (
    <div>
      <span>Ручек: {state().endpoints.length}</span>
      <button onClick={() => void catalog.actions.loadSchema(swagger)}>Перезалить схему</button>
    </div>
  );
}

function RemoveButton(props: { endpoint: OpenapiEndpoint }) {
  // Хуки контекста зовутся в теле компонента, не внутри onClick: обработчик выполняется вне
  // владельца, и `useApiId` там уже ничего не найдёт.
  const catalog = useApiCatalog();
  return (
    <button onClick={() => catalog.actions.removeEndpoint(endpointKey(props.endpoint))}>
      Убрать
    </button>
  );
}

export function MyApiScreen(props: { consumers: readonly Consumer[] }) {
  return (
    <ApiManagerProvider api="main">
      <Toolbar />
      <ApiList>
        {(endpoint) => (
          <>
            <BindEndpoint apiId="main" endpoint={endpoint} consumers={props.consumers} />
            <RemoveButton endpoint={endpoint} />
          </>
        )}
      </ApiList>
    </ApiManagerProvider>
  );
}
```

`ApiList` знает только состав каталога и его состояния (грузим / не распозналось / пусто / список).
Что монтируется на строку — решает тот, кто собирает экран, поэтому действие приходит
функцией-ребёнком.

`ApiManagerProvider` документ **не** подхватывает: он отвечает на вопрос «с каким API мы сейчас
работаем», а грузят схему действием (`loadSchema`) — иначе вторая загрузка молча бы игнорировалась.

---

<h2 id="кейс-6">6. Одна ручка — два компонента с разными правилами</h2>

`GET /users` кормит и таблицу, и листбокс, но ложится на них **по-разному**. Именно поэтому
правила живут не на ручке, а на стыке «ручка ↔ компонент», а стор привязок ключуется **именем
компонента**.

```ts
import { bindingKey, bindingStoreOf } from "@web-core/feeder";

const source = { apiId: "main", endpointId: "GET https://my.back/users" };
const id = bindingKey(source);

const table = bindingStoreOf("Table");
table.actions.bind(source);
table.actions.setRoot(id, "/data/items");
table.actions.setRules(id, [
  { target: "/title", from: "/name" },
  { target: "/done", from: "/active" },
]);

const list = bindingStoreOf("ListBox");
list.actions.bind(source);
list.actions.setRoot(id, "/data/items");
list.actions.setRules(id, [
  { target: "/value", from: "/id" },
  { target: "/text", from: "/name" },
]);
```

Обратите внимание: `id` у обеих привязок одинаковый (это одна и та же ручка), но сторы разные —
пересечься они не могут.

**Повторный `bind` той же ручки** трактуется как смена параметров вызова, а не как вторая
привязка: `source.value` переписывается, а уже сведённые правила остаются (ручка и форма её ответа
те же).

---

<h2 id="кейс-7">7. Сохранить привязки на бэк и поднять обратно</h2>

Движок между сессиями ничего не хранит. `Binding` — чистый JSON, поэтому сохранение тривиально.

```ts
import { bindingStoreOf, type Binding } from "@web-core/feeder";

// Сохранить (например, после каждого изменения на экране настроек).
const bindings: readonly Binding[] = bindingStoreOf("Table").get().bindings;
await api.save("feeder/bindings/Table", bindings);

// Поднять при старте приложения.
const saved = (await api.load("feeder/bindings/Table")) as Binding[];
bindingStoreOf("Table").actions.hydrate(saved);
```

⚠️ Привязка ссылается на ручку айди-строкой (`"GET https://my.back/users"`). Чтобы поднятая
привязка заработала, **ручка с таким айди должна быть в каталоге** — то есть при старте нужно либо
`loadSchema(raw)`, либо `addEndpoint(...)`. Если ручки нет, `feedOf` вернёт именно эту беду
текстом, а не пустой список.

Поэтому же айди ручки — метод+url, а не индекс и не UUID: перезалив того же документа даёт новый
массив объектов, и любой айди «по порядку» порвал бы все привязки.

---

<h2 id="кейс-8">8. Сведение само по себе, без API</h2>

`Mapping` не знает ни про ручки, ни про привязки — это чистый стык «источник → потребитель».
Годится для любой пары: ответ ручки, значение дерева, содержимое файла, что угодно.

```tsx
import { Mapping, type MappingChange } from "@web-core/feeder";
import { createSignal } from "solid-js";
import { z } from "@web-core/io";

const source = { data: { items: [{ id: 1, full_name: "Ада Лавлейс", years: 36 }] } };
const target = z.object({ name: z.string(), age: z.number() });

export function MappingDemo() {
  const [change, setChange] = createSignal<MappingChange>({ root: "", rules: [] });

  return (
    <>
      <Mapping
        source={source}
        target={target}
        root={change().root}
        rules={change().rules}
        onChange={setChange}
      />
      <pre>{JSON.stringify(change(), null, 2)}</pre>
    </>
  );
}
```

- **полностью контролируемый**: `root`/`rules` приходят снаружи, наружу течёт на каждый пик (не по
  кнопке). Хранение — забота того, кто монтирует;
- `source` и `target` — каждый либо сырые данные, либо zod-схема, различаются по `instanceof`;
- **смена «где записи» уносит осиротевшие правила.** Сменился набор — сменились пути внутри
  записи; молча оставленное правило с несуществующим `from` дало бы пустое поле на витрине, и это
  выглядело бы как беда данных, хотя это беда настройки;
- пути показываются **записи**, а не ответа: `/data/items/0/name` в ответе — это `/name` в записи,
  потому что правила применяются к одной записи.

v1 строит только `{ target, from }` — 1:1. Трансформации (`steps`) и `onFail` из `FieldRule`
движок `@web-core/io` умеет, но UI под них пока нет.

---

<h2 id="кейс-9">9. Headless: дёрнуть ручку и применить привязку кодом</h2>

Без единого компонента — например, в тесте, в скрипте прогрева или в своём стороннем UI.

```ts
import {
  apiCatalogOf,
  applyBinding,
  endpointBy,
  invokeEndpoint,
  type Binding,
} from "@web-core/feeder";

const binding: Binding = {
  source: { apiId: "main", endpointId: "GET https://my.back/users", value: { limit: 10 } },
  root: "/data/items",
  rules: [{ target: "/text", from: "/name" }],
};

const endpoint = endpointBy(apiCatalogOf("main").get(), binding.source.endpointId);
if (endpoint === undefined) throw new Error("ручки нет в каталоге");

const result = await invokeEndpoint(endpoint, binding.source.value);
// result: { status, ok, headers, body }

const feed = applyBinding(result.body, binding);
// feed: { rows, report, error }
```

Разница в контрактах, о которой стоит помнить:

| Функция | Не-2xx | Оборванная сеть |
| --- | --- | --- |
| `invokeEndpoint` | **валидный результат** (`ok: false`, статус, тело) | **исключение** — ответа не было вовсе |
| `feedOf` / `useFeed` | `error: "ручка ответила 500"` | `error: "ручка не ответила: …"` |

`invokeEndpoint` — инструмент постмановского рода: 404 и 500 надо показывать со статусом и телом
так же, как 200. `feedOf` — кормление компонента: там любая беда это просто «еды нет, вот почему».

---

<h2 id="кейс-10">10. Дерево по зод-схеме (`TreeForm`)</h2>

Самый старый мод пакета, живой и сегодня: полностью контролируемая форма по произвольной
zod-схеме. Внутри `BindEndpoint` именно им настраиваются параметры ручки.

```tsx
import { TreeForm } from "@web-core/feeder";
import { createSignal } from "solid-js";
import { z } from "@web-core/io";

const schema = z.object({
  name: z.string(),
  active: z.boolean(),
  variant: z.enum(["solid", "outline"]),
  tags: z.array(z.object({ value: z.string(), label: z.string() })),
});

export function TreeDemo() {
  const [value, setValue] = createSignal<unknown>({});
  return (
    <>
      <TreeForm schema={schema} value={value()} onChange={setValue} />
      <pre>{JSON.stringify(value(), null, 2)}</pre>
    </>
  );
}
```

Проверяется взглядом: три вида листа (скаляр / булево / enum), список с «Добавить»/«Убрать», запись
по пути — `<pre>` обновляется на каждую правку. Схему структуры юзер не меняет, только наполняет.

---

<h2 id="кейс-11">11. На витрине пусто — где смотреть</h2>

`feed()?.error` называет беду словами. Полный список того, что он может сказать, и что это значит:

| Что видно | Что случилось | Что делать |
| --- | --- | --- |
| `feed()` — `undefined`, в сеть не ходили | привязки для этого имени компонента нет | привязать (кейс 1) или `hydrate` (кейс 7); проверить, что имя совпадает с `Consumer.name` |
| `привязка без адаптера: поля ещё не сведены` | `rules: []` | свести поля; проверить `isFed(binding)` |
| `ручки «GET …» нет в каталоге API «main»` | каталог пуст или ручку убрали после привязки | `loadSchema`/`addEndpoint` при старте приложения |
| `ручка ответила 500` | бэк ответил не-2xx | смотреть саму ручку; тело ошибки на вход компонента не кладётся намеренно |
| `ручка не ответила: …` | сеть/CORS/кривой url | смотреть консоль браузера |
| `в ответе нет пути «/data/items»` | форма ответа не та, на которой настраивали | перевыбрать «где записи» |
| `по пути привязки лежит скаляр` | по `root` не массив и не объект | перевыбрать «где записи» |
| `rows` пустые, `error: null` | правила применились, но значения не собрались | смотреть `report.issues` — там `target`, причина и примеры |

`feed()?.report` — тот же отчёт, что у `@web-core/io`: `total`/`converted`/`rejected`, `issues`
(что не легло и на скольких записях, с примерами) и `unmapped` (поля источника, которые никуда не
пошли). Ничего не выбрасывается молча.

---

<h2 id="кейс-12">12. Подключить в `apps/studio` для живой пробы</h2>

```tsx
// apps/studio/src/pages/lab/index.tsx
import { BindingEditor, useFeed } from "@web-core/feeder";
import { z } from "@web-core/io";

const consumers = [{ name: "Table", input: z.object({ title: z.string() }) }];

export function LabPage() {
  const { feed } = useFeed("Table");

  return (
    <>
      <BindingEditor api="lab" raw={swagger} consumers={consumers} />
      <h3>Что получил Table</h3>
      <pre>{JSON.stringify(feed()?.rows ?? feed()?.error, null, 2)}</pre>
    </>
  );
}
```

Оба экрана на одной странице — самый быстрый способ увидеть цикл целиком: свёл поля в верхней
половине, нижняя обновилась сама (привязка реактивная, `useFeed` пересчитается).

Форму входа реального компонента кита можно взять из `@web-core/ui`:
`kitComponentProvider().io.get("Table")?.schema` — это zod-схема, ровно то, что ждёт `Consumer.input`.
