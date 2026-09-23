# 🧬 web-core Solid

🏷️ framework · 🧬 engine · 📦 `@web-core/solid`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- 🧪 [Примеры](./EXAMPLES.md) — рабочий код по кейсам, движок и примитивы врозь
- ❓ [FAQ](./FAQ.md)
- 🔑 [Примитивы](./PRIMITIVES) — по файлу на взятый ([`keyed`](./PRIMITIVES/keyed.md),
  [`rootless`](./PRIMITIVES/rootless.md)) плюс [бэклог](./PRIMITIVES/BACKLOG.md) того, что ещё не
  взяли

<h2 id="главное">🏠 Главное</h2>

🧬 Solid.js web-core — единственная точка резолва вместо вендора, тем же приёмом, что
`@web-core/router` для `@tanstack/solid-router`. Зона импортирует ровно этот пакет, никогда
`solid-js`/`solid-js/web` напрямую — тогда `createSignal`/`onMount`/`render` во всех файлах ловят
один и тот же модуль-синглтон, а версию решает architect в одном месте, а не 20 `package.json`
по репозиторию. 🛠️ Средство, а не решение: сам по себе пакет не приносит своего вида, только
резолв — ПЛЮС то, чего у самого Solid нет: собственные добавления (`mountApp()`/`#root`, точка
входа приложения) и примитивы комьюнити, взятые готовыми (`./keyed`, `./rootless`).

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM-анатомии — «часть» здесь означает подпуть поставки. Подпуть называет
ПРОИСХОЖДЕНИЕ кода: два зеркалят вход `solid-js` и `solid-js/web` дословно, один держит
собственное добавление пакета, два — примитивы комьюнити, взятые готовыми.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Реактивное ядро | `@web-core/solid` | весь `solid-js` (`createSignal`, `createEffect`, `createMemo`, `onMount`, `onCleanup`, `createUniqueId`, JSX-типы, …) |
| DOM-рендер | `@web-core/solid/web` | весь `solid-js/web` (`render`, `Portal`, `hydrate`, …) |
| Точка монтирования | `@web-core/solid/mount` | `mountApp(root)` — СОБСТВЕННОЕ добавление, не из вендора |
| Поток по ключу | `@web-core/solid/keyed` | весь `@solid-primitives/keyed` (`Key`, `Entries`, `MapEntries`, `SetValues`, `Rerun`, `keyArray`) |
| Корни и их уничтожение | `@web-core/solid/rootless` | весь `@solid-primitives/rootless` (`createSingletonRoot`, `createSubRoot`, `createRootPool`, `createDisposable`, `createCallback`, `createHydratableSingletonRoot`) |

📦 Внутри пакета: `src/index.ts` — единственный файл в корне `src/`, тонкая поверхность (один
реэкспорт `engine/`). Каждый подпуть — своя папка: `src/engine/index.ts`
(`export * from "solid-js"`), `src/web/index.ts` (`export * from "solid-js/web"`),
`src/mount/index.ts` (`mountApp`), `src/keyed/index.ts`
(`export * from "@solid-primitives/keyed"`), `src/rootless/index.ts`
(`export * from "@solid-primitives/rootless"`) — по форме `@web-core/router` (`index.ts` +
`engine/` + `vite/` + `devtools/`).

<h2 id="использование">🚀 Использование</h2>

**Реактивное ядро** — импорт один в один с `solid-js`, другим спецификатором:

```ts
import { createSignal, onCleanup, onMount } from "@web-core/solid";

const [count, setCount] = createSignal(0);
onMount(() => console.log("mounted"));
```

**DOM-рендер** — нужен редко напрямую (обычно закрыт `mountApp`), но доступен как есть:

```ts
import { render } from "@web-core/solid/web";
```

**Точка монтирования** (`main.tsx` потребителя, `placed-once` — кладётся один раз и не
обновляется):

```tsx
import { mountApp } from "@web-core/solid/mount";

mountApp(() => <App />);
```

```html
<!-- index.html потребителя -->
<div id="root"></div>
```

**Поток по ключу** — `<Key>` вместо `<For>`, когда список перестраивается новыми объектами, а
узел за ключом обязан пережить перестройку. `by` — имя поля или функция ключа; `item` и `index`
в теле — СИГНАЛЫ, не значения:

```tsx
import { Key } from "@web-core/solid/keyed";

<Key each={props.items} by={props.itemKey}>
  {(item) => <Node value={props.itemKey(item())} />}
</Key>;
```

**Корни и их уничтожение** — когда `createRoot` зовётся внутри кэша или фабрики, а не один раз на
старте. `createSingletonRoot` строит начинку при первом обращении, переиспользует её всеми
следующими и гасит, когда ушёл последний слушатель:

```ts
import { createSingletonRoot } from "@web-core/solid/rootless";

const useConnection = createSingletonRoot(() => openConnection());

// В любом компоненте — соединение одно на всех, и оно закроется само.
const connection = useConnection();
```

Полный разбор трёх способов гашения (владельцем, слушателями, лимитом) —
[`PRIMITIVES/rootless.md`](./PRIMITIVES/rootless.md).

<h2 id="настройки">🎚️ Настройки</h2>

🎚️ У реэкспорта настроек нет — это вендорская поверхность как есть. У `mountApp()` одна: сам
корневой компонент. У `<Key>` — три пропса вендора, у корней из `./rootless` — две настройки на
весь подпуть.

| Настройка | Где | Тип | По умолчанию |
|---|---|---|---|
| `root` | `mountApp(root)` | `() => JSX.Element` | обязательное |
| `each` | `<Key>` | `readonly T[] \| null \| false` | необязательное — пусто значит `fallback` |
| `by` | `<Key>` | `keyof T \| ((item: T) => unknown)` | обязательное |
| `fallback` | `<Key>` | `JSX.Element` | нет — при пустом `each` не рисуется ничего |
| `detachedOwner` | `createSingletonRoot(factory, detachedOwner?)` | `Owner \| null` | владелец в момент создания синглтона |
| `limit` | `createRootPool(factory, { limit })` | `number` | `100` — корни сверх лимита уничтожаются |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Реактивное ядро и DOM-рендер — вендорские состояния как есть, пакет их не меняет. У
`mountApp()` три состояния, все вокруг `#root`; у синглтон-корня из `./rootless` — четыре, и
различает их счётчик слушателей.

| Состояние | Метка | Где |
|---|---|---|
| Первый вызов `mountApp()` на `#root` | записи в `mounted` не было | `src/mount/index.ts` |
| Повторный вызов `mountApp()` на том же `#root` (HMR, рестарт) | прежний `dispose` вызван до нового `render` | `src/mount/index.ts` |
| `#root` не найден | брошен `Error` с текстом, куда добавить `<div id="root">` | `src/mount/index.ts` |
| Синглтон построен | первое обращение, слушателей не было | `./rootless` |
| Синглтон переиспользован | слушателей больше нуля, `factory` не зовётся | `./rootless` |
| Синглтон ждёт в окне микротаска | последний слушатель ушёл, корень ещё жив | `./rootless` |
| Синглтон уничтожен | микротаск прошёл, слушателей так и нет — `onCleanup` внутри сработал | `./rootless` |

<h2 id="io">🔌 IO</h2>

Вход и выход реактивного ядра/DOM-рендера — вендорские сигнатуры один в один, пакет их не
переопределяет.

<h3>📥 Вход</h3>

| Функция | Принимает |
|---|---|
| `mountApp(root)` | `() => JSX.Element` — корневой компонент |
| `<Key>` | `each`/`by`/`fallback` (см. Настройки) плюс `children` — `(item, index) => JSX.Element`, где оба аргумента СИГНАЛЫ (`Accessor`) |
| `createSingletonRoot(factory)` | `(dispose) => T` — фабрика начинки; `detachedOwner` необязательным вторым |
| `createSubRoot(fn, ...owners)` | `(dispose) => T` плюс список владельцев, любой из которых гасит корень |
| `createRootPool(factory)` | `(arg, active, dispose) => TResult`, где `arg` и `active` — СИГНАЛЫ |

<h3>📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| `mountApp` | `void` — `dispose` наружу не отдаётся, держит его сама функция (`WeakMap`) |
| `<Key>` | `JSX.Element` — узел за ключом переживает перестройку списка новыми объектами |
| `createSingletonRoot` | `() => T` — вызов регистрирует текущего владельца слушателем и отдаёт общую начинку |
| `createSubRoot` | то, что вернуло тело — ручка гашения приезжает в тело аргументом |
| `createRootPool` | `(arg) => TResult` — функция, выдающая корень из пула или новый |

<h2 id="сборки">🏗️ Сборки</h2>

⚠️ Автоматические пробы есть у `./keyed` и `./rootless` — остальное проверено ✅ вручную, `test/` по
подпутям `.`/`./web`/`./mount` ещё не написан (см. `ROADMAP.yaml`, `id: write-test-suite`).

| Проверено | Как | Результат |
|---|---|---|
| `<Key>` держит узел за ключом при подмене объектов списка | `test/keyed.test.tsx`, рендер в JSDOM | узел `[data-key="a"]` тот же, текст обновился |
| `./keyed` отдаёт весь состав вендора | `test/keyed.test.tsx` | `Key`/`Entries`/`MapEntries`/`SetValues`/`Rerun`/`keyArray` — все `function` |
| Синглтон строит начинку один раз на нескольких потребителей | `test/rootless.test.tsx`, счётчик построений | `factory` зван единожды, значение то же самое |
| Синглтон гаснет по уходу последнего слушателя и строится заново | `test/rootless.test.tsx` | после микротаска `onCleanup` сработал, следующий вызов построил заново |
| Корень переживает мгновенную перецепку слушателя | `test/rootless.test.tsx` | гашение отложено на микротаск, начинка та же |
| `createSubRoot` гаснет вместе с владельцем и по своей ручке | `test/rootless.test.tsx` | оба пути дают ровно одну очистку |
| `./rootless` отдаёт весь состав вендора | `test/rootless.test.tsx` | шесть функций — все `function` |
| Пять подпутей собираются раздельными файлами `dist/` | `tsc -p tsconfig.build.json` | `dist/{index,engine,web,mount,keyed,rootless}/…` |
| Барель `.` реэкспортирует `solid-js` целиком | `import()` `dist/index.js` | `createSignal`/`onMount`/… — все на месте |
| `./web` реэкспортирует `solid-js/web` целиком | `import()` `dist/web/index.js` | `render`/`Portal`/… — все на месте |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 `main.tsx` потребителя — единственная точка сборки, где `mountApp()` реально зовётся:

```tsx
// src/main.tsx
import { mountApp } from "@web-core/solid/mount";
import { QueryClient, QueryClientProvider } from "@web-core/query";
import { RouterProvider } from "@web-core/router";

import { router } from "./router.js";

const queryClient = new QueryClient();

mountApp(() => (
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
));
```

Остальные зоны кита сегодня продолжают импортировать `solid-js`/`solid-js/web` напрямую — переезд
на `@web-core/solid` идёт по мере того, как architect решает добавить сюда очередную вещь (см.
ROADMAP.yaml, `id: migrate-direct-solid-imports`), не одним разовым рефакторингом всего кита.
