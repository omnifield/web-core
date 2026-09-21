# 🧪 Примеры — как работать с `@web-core/feeder`

Рабочий код, который можно скопировать и сразу погонять. Устройство — [`README.md`](./README.md),
почему так — [`FAQ.md`](./FAQ.md), что запланировано — [`ROADMAP.yaml`](./ROADMAP.yaml).

Всё ниже сверено с экспортами `src/index.ts` на 2026-09-20.

## 🧭 Навигация

**Экран**
- [1. Загрузить документ API и показать каталог](#кейс-1)
- [2. Свой экран вместо `ApiCatalog`](#кейс-2)

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

**Сведение и кормление**
- [11. Свести поля ответа с формой компонента](#кейс-11)
- [12. Дёрнуть ручку и сразу получить еду (`serve`)](#кейс-12)
- [13. Собрать объект потребителя из ответа кодом (`feed`)](#кейс-13)
- [14. Кто с кем связан](#кейс-14)
- [15. Витрина потребителя: только связанные ручки](#кейс-15)

---

<h2 id="словарь">0. Словарь</h2>

Слова, которые встречаются дальше в примерах.

| Слово | Что это в коде | Чем опознаётся |
| --- | --- | --- |
| **Пресет** | `Preset { id, kind, label, name?, content }` — именованная запись на складе, `content` для склада непрозрачен, `kind` он сравнивает, но не толкует | `id`, uuid при создании |
| **Имена записи** | `label` — человеческое, видно в списке; `name` — машинное, по маске `PRESET_NAME`, им запись зовут снаружи | `name` уникально в пределах вида |
| **Документ схемы** | `SchemaDocument { endpoints, groups, defs }` — наш формат API, он и лежит в `content` | — |
| **Ручка** | `EndpointDescriptor { id, method, url, groupId, params }`, `params[].schema` — JSON Schema | `id`, uuid при разборе документа |
| **Группа** | `Group { id, name }` — компоновка ручек в каталоге, отдельная запись документа; ручкам без группы разбор заводит `unknown` | `id`, uuid при разборе документа |
| **Адаптер** | `Adapter { root, rules, extra?, providers, consumers }` — шов «поставщик → потребитель»: где записи, как ложатся поля, на ком проверяли | `id` пресета, в котором лежит |
| **Связь** | `AdapterRule` — одна строка правил: `{ id, target, from }`, это `FieldRule` из `io` плюс выданный айди | `id`, uuid при заведении |
| **Участник** | путь вида `["api", presetId, endpointId]` — вид первым сегментом, дальше адрес по правилам вида | путём целиком |

Зод из документа не хранится — он строится при отрисовке (`endpointOf`) и живёт ровно столько,
сколько нужно форме.

---

<h2 id="кейс-1">1. Загрузить документ API и показать каталог</h2>

Два компонента на весь экран: первый принимает документ, второй показывает, что из него вышло.

```tsx
import { ApiCatalog, ExternalSchemaLoader } from "@web-core/feeder";

export function ApiScreen() {
  return (
    <>
      <ExternalSchemaLoader />
      <ApiCatalog />
    </>
  );
}
```

Оба ходят в один и тот же модульный стор пресетов — связывать их пропами не нужно. Загрузчик
принимает файл или вставку, разбирает документ и кладёт пресет; каталог показывает все пресеты,
которые похожи на документ API: группы → ручки → форма параметров с кнопкой «Проверить».

Состав правится прямо там же: «+» на схеме заводит пустую группу, «+» на группе — пустую ручку под
ней, корзина убирает схему, группу (со всеми её ручками) или одну ручку.

Ответ каталог не показывает — отдаёт наружу, вместе с тем, чей он:

```tsx
import { ApiCatalog, type ApiCatalogResult } from "@web-core/feeder";

const [probe, setProbe] = createSignal<ApiCatalogResult>();

<ApiCatalog onResult={setProbe} />;
```

`presetId` и `endpoint` в событии нужны, чтобы экран знал, по какой именно ручке пришёл ответ:
на каталоге их десятки. Сорванный вызов сюда не приходит — ответа не было, и `Call`
говорит об этом на месте.

---

<h2 id="кейс-2">2. Свой экран вместо `ApiCatalog`</h2>

Когда нужен свой порядок или своё содержимое строки — `Endpoints` собирается руками.

```tsx
import {
  API_KIND,
  asSchemaDocument,
  Endpoint,
  Endpoints,
  Presets,
  presetsStore,
} from "@web-core/feeder";

export function MyCatalog() {
  return (
    <Presets kind={API_KIND} as={asSchemaDocument} empty="Схем пока нет">
      {(preset, document) => (
        <Endpoints
          label={preset().label}
          document={document()}
          onRemove={() => presetsStore.actions.remove(preset().id)}
        >
          {(endpoint) => <Endpoint endpoint={endpoint()} defs={document().defs} />}
        </Endpoints>
      )}
    </Presets>
  );
}
```

`Presets` — механика склада: отбирает записи своего вида, перебирает их с тождеством по `id`,
приводит содержимое переданным стражем и отдаёт наружу три вещи — аксессор записи, аксессор
приведённого содержимого и правку черновиком (третий аргумент, в примере не нужен):

```tsx
{(preset, document, edit) => (
  <Endpoints
    document={document()}
    onAddGroup={() => edit((draft) => addGroup(draft))}
    …
  />
)}
```

Своего `<Key>`, стража и обработки «пресет не того вида» писать не нужно — это и есть то, что
механика делает за потребителя. `Endpoints` при этом берёт документ целиком, а не список ручек:
реестр групп лежит в нём, и без него пустую группу нечем показать.

Кнопка «Настроить» на узлах — от одного колбэка `onConfig`, и в него приезжает пойманный узел с
ярлыком вида:

```tsx
<Endpoints
  document={document()}
  onConfig={(target) => {
    if (target.kind === "endpoint") setForm(endpointConfigOf(target.item));
    if (target.kind === "group") setForm(groupConfigOf(target.item));
    if (target.kind === "schema") setForm(presetConfigOf(preset()));
  }}
/>
```

Зод под эту форму — `ENDPOINT_CONFIG` / `GROUP_CONFIG` / `PRESET_CONFIG`; обратно в документ
правку кладут `applyEndpointConfig`/`applyGroupConfig` черновиком, а имя записи —
`presetsStore.actions.relabel`. Готовому экрану это подключать не нужно: `ApiCatalog` держит диалог
настройки сам.

Одно обязательное: `children` и у `Presets`, и у `Endpoints` получает **аксессоры**, поэтому
`preset()`/`endpoint()`, а не `preset`/`endpoint` — разбор в `FAQ.md`, «Списки и тождество узла».

---

<h2 id="кейс-3">3. Завести пресет кодом, без загрузчика</h2>

```ts
import { API_KIND, parseSchema, presetsStore } from "@web-core/feeder";

const id = presetsStore.actions.add(API_KIND, "petstore", await parseSchema(rawSwaggerText));
```

`parseSchema` распознаёт документ шаблоном и отдаёт наш `SchemaDocument`. Сырой текст дальше не
нужен и нигде не хранится — чужой формат разбирается один раз, на входе.

Первый аргумент — **вид записи**: по нему запись потом и находят (`presetsOf`). Поставишь свой
вид — каталог схем такую запись не покажет, и это не поломка, а ровно то, ради чего вид завёлся.

Второй — **человеческое имя** (`label`), то, что человек увидит в списке. Машинного имени у
заведённой записи нет вовсе: его дают позже, когда запись называют для службы.

Содержимым пресета может быть что угодно, склад его не проверяет:

```ts
presetsStore.actions.add("заметки", "мои заметки", { any: "json" });
```

Ручки можно собрать и руками, без документа — но айди у каждой обязателен:

```ts
import { presetsStore, type SchemaDocument } from "@web-core/feeder";

const users = { id: crypto.randomUUID(), name: "users" };

const document: SchemaDocument = {
  endpoints: [
    {
      id: crypto.randomUUID(),
      method: "GET",
      url: "https://back/users/{id}",
      groupId: users.id,
      params: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
    },
  ],
  groups: [users],
  defs: {},
};

presetsStore.actions.add(API_KIND, "мой бэк", document);
```

Своим ручкам айди и группу проставляешь сам: сам ставит их только входной слой (`parseSchema`), а
документ без айди у ручки каталог схемой не признает.

Группа обязательна у каждой ручки, и её `groupId` обязан вести в запись `groups` — иначе документ
не наш формат. Не хочется раскладывать по смыслу — заведи одну группу `unknown`, ровно как это
делает разбор для ручек, которым входящая схема группы не назвала.

---

<h2 id="кейс-4">4. Править содержимое пресета точечно</h2>

`edit` даёт immer-черновик содержимого — менять можно на месте, наружу уйдёт новое значение.

```ts
import { presetsStore, type SchemaDocument } from "@web-core/feeder";

presetsStore.actions.edit<SchemaDocument>(id, (draft) => {
  draft.endpoints = draft.endpoints.filter((one) => one.id !== goneId);
});
```

Ручка опознаётся своим `id`, а не методом с урлом: урл юзер правит, и тождество на нём не
держится.

Внутри пакета для этого есть готовые `addGroup`/`addEndpoint`/`removeEndpoint`/`removeGroup`
(`entities/openapi/models/edit`), но наружу они сегодня **не отданы** — снаружи состав правится
черновиком, как выше. Ими же работают кнопки каталога.

Что стоит знать про них, если повторяешь руками: новая запись встаёт **первой** (ручка — первой в
своей группе), `removeGroup` уносит и запись группы, и все ручки под ней, а имя группы правится
как обычное поле — тождество держит `id`, и узел на экране от переименования не вздрагивает.

Группа `unknown` — обычная запись со своим айди: в неё разбор кладёт ручки, которым входящая схема
группы не назвала. Переименовывается, принимает новые ручки и удаляется как любая другая.

Остальные действия склада: `relabel(id, label)` (человеческое имя), `rename(id, name)` (машинное),
`replace(id, content)` (заменить содержимое целиком), `remove(id)`. Вид записи не меняет ничто — он
ставится при заведении и живёт с записью.

Машинное имя обязано пройти маску и быть свободным в своём виде — проверяют этим:

```ts
import { presetNamed, PRESET_NAME, presetsStore } from "@web-core/feeder";

PRESET_NAME.safeParse("users-list").success; // маска: строчная латиница, цифры, дефис
presetNamed("adapter", "users-list");        // уже занято этим видом? — запись или undefined

presetsStore.actions.rename(id, "users-list");
```

Внутри узла `Presets` то же самое делается третьим аргументом `children` — правка уже привязана
к своей записи, айди подставлять не нужно.

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

`hydrate` заменяет состав целиком — это подъём сохранённого, а не слияние. Вид (`kind`) уезжает и
приезжает вместе с записью: без него поднятую запись не найдёт ни один экран.

---

<h2 id="кейс-6">6. Состав ручек без UI — сгруппировать и обойти</h2>

```ts
import { asSchemaDocument, groupEndpoints, presetsStore } from "@web-core/feeder";

const document = asSchemaDocument(presetsStore.selectors.presetBy(id)?.content);

if (document !== undefined) {
  for (const group of groupEndpoints(document)) {
    console.log(group.name, group.endpoints.map((one) => `${one.method} ${one.url}`));
  }
}
```

`asSchemaDocument` — это и проверка, и приведение: не похоже на документ API — вернёт `undefined`,
а не бросит. `groupEndpoints` отдаёт группы в порядке реестра документа, включая пустые: у них своя
запись, и от наличия ручек она не зависит.

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

`Endpoint` делает это целиком (внутри — форма по зод-схеме и `Call` с кнопкой), но если нужен свой
вид — из ручки берётся зод, и дальше это обычная форма.

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
| Пресет завёлся, но каталога с ним нет вовсе — ни узла, ни отказа | у записи другой вид: каталог берёт только `kind === API_KIND`, остальные не его | `presetsStore.selectors.presetsOf(API_KIND)` |
| Пресет завёлся, но каталог пишет «не похож на схему API» | вид свой, а `content` не прошёл `asSchemaDocument` — нет массива `endpoints`, элементы без `id`/`method`/`url`/`params`, либо в `groups` лежит не `{ id, name }` | `asSchemaDocument(preset.content)` в консоли |
| Пресет завёлся, но каталог пишет «не похож на схему API», хотя ручки на месте | у ручки нет `groupId` или он не ведёт ни в одну запись `groups` — группу раздаёт вход, документ без неё этот вход не проходил | `document.groups` и `groupId` ручек |
| Ручка есть, а параметров в форме нет | у ручки пустой `params` — документ их не объявил | `endpointOf(descriptor, defs).schema` |
| Параметр есть, а поле не рисуется | `$ref` указывает в `defs`, которого нет — неизвестная ссылка становится `z.unknown()` | `document.defs` |
| Вызов молча ничего не вернул | сорванный транспорт — это исключение; `useInvoke` кладёт его текст в `failure()` | `invocation.failure()` |

---

<h2 id="кейс-11">11. Свести поля ответа с формой компонента</h2>

Мастер сведения открывается для ПАРЫ участников: кто даёт данные и кто их ест. Вид участника
объявляется построителем — руками путь не собирают.

```tsx
import { AdapterMastering, API_USER, ApiProbe, defineUserKind } from "@web-core/feeder";
import { describeSample, describeSchema } from "@web-core/io";
import { createSignal } from "@web-core/solid";

const COMPONENT_USER = defineUserKind("component", (name: string) => [name]);

export function Bench(props: { schema: z.ZodType; component: string }) {
  const [probe, setProbe] = createSignal<ApiCatalogResult>();

  return (
    <>
      <ApiProbe onResult={setProbe} />

      <Show when={probe()}>
        {(shot) => (
          <AdapterMastering
            provider={API_USER.path(shot().presetId, shot().endpoint.id)}
            consumer={COMPONENT_USER.path(props.component)}
            output={describeSchema(props.schema)}
            input={describeSample(shot().result.body)}
          />
        )}
      </Show>
    </>
  );
}
```

Правая колонка строится по ЖИВОМУ ответу — пока ручку не дёрнули, сводить не с чем. Левая берётся
из паспорта формы потребителя, проба для неё не нужна.

Связи сохраняются сами: мастер ищет запись адаптера этой пары на складе, а при первой связи заводит
её и записывает обоих участников. Ничего не перетащили — записи нет.

---

<h2 id="кейс-12">12. Дёрнуть ручку и сразу получить еду</h2>

```ts
import { serve } from "@web-core/feeder";

const shot = await serve(endpoint, { limit: 10 }, {
  provider: API_USER.path(presetId, endpointId),
  consumer: COMPONENT_USER.path("user-card"),
});

shot.result;  // оригинал ответа: status, ok, headers, body — приезжает всегда
shot.data;    // объект формы потребителя, готовый к показу
shot.report;  // converted / rejected / unmapped
shot.error;   // промах корня словами
```

Адаптера для этой пары ещё нет — `data`, `report` и `error` будут `undefined`, а `result` придёт
как обычно. Это не отказ: ответ получен, кормить просто нечем.

---

<h2 id="кейс-13">13. Собрать объект потребителя из ответа кодом</h2>

То же, что делает `serve` внутри, но на готовом ответе и готовой записи.

```ts
import { feed } from "@web-core/feeder";

const response = {
  meta: { title: "Курсы" },
  data: [{ code: "USD", rate: 1 }, { code: "EUR", rate: 1.1 }],
};

const adapter = {
  root: "/data",
  rules: [
    { id: "r0", target: "/title", from: "/meta/title" },
    { id: "r1", target: "/items/0/label", from: "/code" },
    { id: "r2", target: "/items/0/value", from: "/rate" },
  ],
  providers: {},
  consumers: {},
};

feed(response, adapter).value;
// { title: "Курсы", items: [{ label: "USD", value: 1 }, { label: "EUR", value: 1.1 }] }
```

Род правила решает позиция цели: `/items/0/label` содержит индекс — значит поле каждой записи
набора, `/title` индекса не имеет — значит одно значение, и источник читается от корня ответа.

Сам набор называет источник: `from: "/data/0/code"` — это «в `data`, их много, брать `code`».
Поэтому `root` можно не заполнять вовсе (в примере выше он задан, и тогда пути источников
считаются относительными записи — `"/code"`). Коллекций может быть несколько: правила с `/legend/0/…` соберут второй список из тех же
записей.

---

<h2 id="кейс-14">14. Кто с кем связан</h2>

```ts
import { partnersOf, savedAdapters, usersOf } from "@web-core/feeder";

const adapters = savedAdapters().map((one) => one.content);

// какие ручки кормят этот компонент
partnersOf(adapters, "consumers", COMPONENT_USER.path("user-card"));
// → [["api", "preset-7", "endpoint-3"], …]

// кого кормит эта ручка
partnersOf(adapters, "providers", API_USER.path(presetId, endpointId));
// → [["component", "user-card"], …]

// все проверенные поставщики одной записи
usersOf(adapters[0], "providers");
```

Пути возвращаются целиком, вместе с видом первым сегментом — по нему `userKindOf(path)` скажет,
ручка это или компонент. Один и тот же партнёр из двух записей в списке не двоится.

`savedAdapters()` отдаёт записи уже приведёнными стражем, вместе с пресетом
(`{ preset, content }`) — доставать их со склада и фильтровать руками не нужно. Для других видов
записей есть та же механика общего вида: `recordsOf(kind, as)`.

---

<h2 id="кейс-15">15. Витрина потребителя: только связанные ручки</h2>

```tsx
import { ApiProbe } from "@web-core/feeder";

<ApiProbe
  consumer={COMPONENT_USER.path("user-card")}
  onServing={(event) => board.put(event.serving.data)}
/>;
```

Каталог сам спросит `partnersOf`, какие ручки связаны с этим потребителем, и покажет только их:
схемы без связанных ручек не рисуются, а когда связей нет вовсе — скажет это словами.

Вызов идёт через `serve`, поэтому в событии приезжает не сырой ответ, а конверт вместе с
происхождением:

```ts
event.presetId;              // в какой схеме
event.endpoint;              // какая ручка ответила
event.serving.result;        // оригинал: status, ok, headers, body
event.serving.data;          // объект формы потребителя
event.serving.report;        // что сошлось, что нет
```

Правки состава у этого каталога нет: ни «Добавить», ни «Убрать», ни «Настроить» — это витрина, а
не редактор.
