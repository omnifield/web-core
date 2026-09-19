# 🥣 web-core Feeder

🏷️ interfaces · 🧬 engine · 📦 `@web-core/feeder`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)
- 🧪 [Примеры](./EXAMPLES.md)

<h2 id="главное">🏠 Главное</h2>

⚡ Первая сущность корня `interfaces/` — слоя между `packages/` (кирпичи) и `apps/` (поверхности):
сущность здесь сводит функционал нескольких пакетов фреймворка и накладывает на него UI, а
пользуется результатом больше чем одно приложение. `interfaces/chat` — второй ожидаемый кейс этого
же слоя, ещё не заведён.

🍽️ Feeder отвечает на один вопрос целиком: **откуда компонент берёт данные и как чужой ответ
становится его формой**. Сегодня собрана первая половина этого пути:

1. **принять описание API** — загрузить документ Swagger 2.0 или завести ручки руками, получить
   именованный пресет;
2. **показать и поправить состав** — теги, ручки, параметры;
3. **дёрнуть ручку** — форма параметров по схеме, живой HTTP-вызов, ответ на экране.

Вторая половина — адаптер, шов между поставщиком данных и их потребителем — пока существует как
решённая модель и заготовка `entities/adapter`: форма записи в коде ещё старая. Разбор — `FAQ.md`,
раздел «Адаптер»; состояние — `ROADMAP.yaml`, `adapter-split-not-done`.

🧪 Живого браузера на текущей сборке не было — проверка только vitest+jsdom.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ Один вход, без подпутей: `@web-core/feeder`.

| Часть | Экспортирует | Про что |
| --- | --- | --- |
| Загрузка | `ExternalSchemaLoader` | принять документ файлом или вставкой, разобрать, положить пресетом |
| Каталог | `SchemaCatalog`, `Endpoints` | состав API: теги → ручки → параметры |
| Вызов | `EndpointCall`, `useInvoke`, `invokeEndpoint` | форма параметров, один HTTP-вызов, ответ |
| Склад | `presetsStore`, `Presets`, `PresetCard`, `PresetInfo`, `PresetLoader` | именованные пользовательские записи |
| Модель API | `parseSchema`, `asSchemaDocument`, `endpointOf`, `endpointKey`, `groupEndpoints`, `schemaNodeToZod` | наш формат документа и работа с ним |
| Форма | `TreeForm` | дерево по произвольной зод-схеме |
| Адаптер | `applyAdapter`, `adapterStoreOf`, `adapterBy`, `sourceKey`, `isFed`, `noFeed` | заготовка шва, UI ещё нет |
| Типы | `Preset`, `PresetsState`, `SchemaDocument`, `SchemaNode`, `EndpointDescriptor`, `EndpointParam`, `EndpointGroup`, `HttpMethod`, `ParamIn`, `OpenapiEndpoint`, `InvokeResult`, `Invocation`, `Adapter`, `AdaptersState`, `FeedSource`, `Consumer` | |

📦 Внутри — адаптированный FSD, переосмысленный под движок (правила слоёв — [`src/DBP.md`](./src/DBP.md)):

- `entities/preset` — склад: `Preset { id, name, content }`, стор и UI карточек. Про содержимое
  `content` не знает ничего;
- `entities/openapi` — наш формат API: `SchemaDocument { endpoints, defs }`, распознавание
  Swagger 2.0 (`swagger2Template` поверх `@web-core/generators/mapping`), JSON Schema → zod
  (`schemaNodeToZod`), группировка по тегам, правки состава, примитивы вызова;
- `entities/form` — движок дерева по зод-схеме (`Tree`, `useTree`, `itemBinding`, kit инпутов);
- `entities/adapter` — заготовка шва «поставщик → потребитель»: тип, стор, `applyAdapter` поверх
  `@web-core/io`. Ни один экран его сегодня не зовёт;
- `features/external-schema` — экран загрузки документа;
- `features/api-manager` — каталог пресетов-схем и вызов ручки;
- `features/tree-form` — `TreeForm`, интерфейсная обёртка над `entities/form`;
- `shared/ui/box` — общий аккордеон-узел со своими действиями, на нём стоят и каталог, и списки
  формы.

Почему склад не знает про ручки, а `entities/openapi` — про склад: это два независимых предмета,
и сводит их фича. Разбор — `FAQ.md`, «Пресет как склад».

<h2 id="использование">🚀 Использование</h2>

✅ Экран настройки API — два компонента:

```tsx
import { ExternalSchemaLoader, SchemaCatalog } from "@web-core/feeder";

<>
  <ExternalSchemaLoader />
  <SchemaCatalog />
</>;
```

Связывать их не нужно — оба ходят в модульный стор пресетов.

✅ Пресет без загрузчика:

```ts
import { parseSchema, presetsStore } from "@web-core/feeder";

presetsStore.actions.add("petstore", await parseSchema(rawSwaggerText));
```

✅ Вызов ручки кодом:

```ts
import { endpointOf, invokeEndpoint } from "@web-core/feeder";

const result = await invokeEndpoint(endpointOf(descriptor, document.defs), { id: 7 });
```

✅ Форма по любой зод-схеме:

```tsx
import { TreeForm } from "@web-core/feeder";

<TreeForm schema={schema} value={value()} onChange={setValue} />;
```

Все сценарии по шагам — [`EXAMPLES.md`](./EXAMPLES.md): свой экран вместо `SchemaCatalog`, точечная
правка состава, сохранение пресетов наружу, форма параметров своими руками, таблица «документ не
распознался — где смотреть».

<h2 id="настройки">🎚️ Настройки</h2>

🔧 `ExternalSchemaLoader` и `SchemaCatalog` — **без пропов**: оба работают с общим стором пресетов.

`Endpoints` — `endpoints: EndpointDescriptor[]`, необязательный `label` (заголовок верхней секции)
и набор колбэков: `onAddTag`, `onRemove`, `onAddEndpoint(tag)`, `onRemoveTag(tag)`,
`onRemoveEndpoint(endpoint)`. Кнопки появляются **от самого колбэка** — не передали, кнопки нет.
`children` — что монтируется внутрь ручки; принимает **аксессор**, не значение.

`Presets` / `PresetCard` — `children` тоже аксессорный, по той же причине.

`EndpointCall` — `endpoint: EndpointDescriptor`, `defs`, необязательный `onResult`.

`PresetLoader` — `onLoad(raw)`, необязательные `onPick(fileName)` и `disabled`.
`PresetInfo` — `name` / `onName`.

`TreeForm` — `schema: z.ZodType`, `value`, `onChange`.

Чего у движка **нет**: форматов кроме Swagger 2.0; заголовков и авторизации у вызова; UI сведения
полей; хранения между сессиями.

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Пакет держит одно живое состояние в сторе, остальное контролируется снаружи.

- `presetsStore` — `{ presets: Preset[] }`, модульный синглтон (`createActionStore`
  из `@web-core/store`). Действия: `add(name, content) → id`, `remove(id)`, `rename(id, name)`,
  `replace(id, content)`, `edit<T>(id, recipe)` (immer-черновик содержимого), `hydrate(presets)`.
  Селектор `presetBy(id)`. Айди — uuid при создании, и он не зависит ни от имени, ни от
  содержимого;
- `adapterStoreOf(key)` — семья сторов адаптеров, заготовка: живого потребителя нет.

Локальное состояние сборки: `EndpointCall` держит значение параметров и результат вызова,
`ExternalSchemaLoader` — имя будущего пресета и текст ошибки разбора.

<h2 id="io">🔌 IO</h2>

↔️ **Загрузка.** Вход — сырой текст документа. `parseSchema(raw)` прогоняет его через шаблоны
(сегодня один, Swagger 2.0, совпадение жёсткое) и отдаёт `SchemaDocument`. Нераспознанный документ
— исключение, экран показывает его текстом.

↔️ **Документ.** `SchemaDocument { endpoints, defs }`; ручка — `{ method, url, tag?, params }`, где
`params[].schema` — JSON Schema, а `defs` держит общие типы (`$ref` остаются ссылками, циклы не
разворачиваются). Чистый JSON: сериализуется и уезжает на склад как есть. Зод строится из формата
при отрисовке (`endpointOf`) и нигде не хранится.

↔️ **Склад.** `Preset { id, name, content }`, `content` непрозрачен. `hydrate` заменяет состав
целиком.

↔️ **Вызов.** `invokeEndpoint(endpoint, value)` → `InvokeResult { status, ok, headers, body }`.
Имя, встреченное в `{плейсхолдере}` url, уходит в путь; ключ `body` — в JSON-тело; остальное — в
query. **Не-2xx — валидный результат**, а сорванный транспорт — исключение: ответа не было вовсе.
`useInvoke` это исключение ловит и кладёт текст в `failure()`.

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Vitest + jsdom. **111 тестов, все зелёные:**

- `entities/openapi` — распознавание petstore, JSON Schema → zod (вложенные `$ref`, циклы через
  `z.lazy`), дескриптор → ручка, группировка по тегам, правки состава, живучесть узлов состава;
- `entities/preset` — стор (добавить/убрать/переименовать/заменить/править черновиком/поднять),
  список и карточка в настоящем DOM, загрузчик;
- `entities/form` — `itemBinding`/`useTree` чистой логикой и `Tree` смонтированным по-настоящему;
- `entities/adapter` — `applyAdapter` на наборе записей и на одиночном объекте, все именные отказы,
  стор;
- `features/api-manager` — вызов на моке `fetch` (путь/квери/тело, 404 как результат, TypeError как
  исключение), `useInvoke`, каталог схем в DOM;
- `features/external-schema` — сквозной путь «вставили документ → в сторе лежит разобранный пресет»;
- `shared` — `Box`: кнопки от колбэков, действие отдаёт элемент, верхняя секция от `label`.

`lint` и `typecheck` зелёные.

Ark-UI/Zag/Kobalte внутри `@web-core/ui` отдают сырой `.jsx` по `solid`-condition — vitest грузит
его напрямую через Node и падает; лечится `test.server.deps.inline` в `vitest.config.ts`.

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Три приёма, которые стоит понять, чтобы не спорить с движком:

**Чужой формат разбирается один раз, на входе.** После импорта нет ни Swagger 2.0, ни любого
другого — есть наш документ. Иначе каждая манипуляция начиналась бы с вопроса «а что это за формат
и как его читать», и так на сто форматов вперёд. Поэтому сырьё не хранится, а правка ручки не
упирается в сериализацию чужой спеки.

**Склад не знает, что на нём лежит.** `Preset` — имя плюс непрозрачное содержимое. Сегодня
содержимое одно (документ API), завтра будет адаптер — и складу от этого не придётся меняться.

**Тождество узла — по ключу, а не по ссылке.** Состояние живёт в DOM (открытость аккордеона, фокус,
ввод), а иммутабельный стор отдаёт новый объект на каждую правку. Поэтому списки перебираются
`<Key by>`, а тела списков принимают аксессор, а не значение: узел остаётся тем же, меняется то,
что он показывает. Разбор — `FAQ.md`, «Списки и тождество узла».

Вся механика описания форм и применения правил — в `@web-core/io`. Feeder не пишет своего движка
сведения: он даёт интерфейс и решает, что и в каком порядке спросить у человека.
