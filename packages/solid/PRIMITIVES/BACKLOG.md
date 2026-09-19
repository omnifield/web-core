# 📋 Бэклог примитивов — что нам нужно, но мы ещё НЕ взяли

> ## ⚠️ Ничего из списка ниже из пакета не импортируется
>
> Это очередь, а не поставка. Каждая строка — примитив, который **существует у комьюнити** и
> который мы вытянем, когда появится реальный повод. Пока повода не было — примитива у нас нет,
> сколько бы подробно он тут ни был описан.
>
> **Что взято и работает** — соседние файлы этой папки, по одному на примитив:
> [`keyed.md`](./keyed.md). Полный состав поставки — [`README.md`](../README.md), раздел
> «Анатомия».
>
> **Взять следующий — заявка архитектору, а не `pnpm add` в своей зоне:** зависимость в поставку
> решает он, владелец зоны только предлагает и обосновывает. Взяли — строка уезжает отсюда в
> собственный файл рядом.

Источник: [`solidjs-community/solid-primitives`](https://github.com/solidjs-community/solid-primitives) —
монорепа реактивных примитивов для Solid, ведут люди из core-команды Solid и экосистемы (не
сторонний энтузиаст). Де-факто стандарт комьюнити, аналог VueUse для Vue. ~85 отдельных npm-пакетов
(`@solid-primitives/<name>`), каждый ставится и тришейкается по одному.

- Доки по каждому: `https://primitives.solidjs.community/package/<name>` (сверено 2026-09-19;
  прежний адрес `/docs/<name>`, которым файл был заведён, теперь отдаёт 404)
- Исходник по каждому: `https://github.com/solidjs-community/solid-primitives/tree/main/packages/<name>`

Разбивка по разделам — как на сайте комьюнити. Порядок внутри раздела ничего не значит:
приоритета у очереди нет, берём по поводу, а не по списку.

## Inputs

- **active-element** — отслеживает, какой DOM-элемент сейчас в фокусе. [docs](https://primitives.solidjs.community/package/active-element/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/active-element)
- **autofocus** — директива автофокуса элемента при монтировании. [docs](https://primitives.solidjs.community/package/autofocus/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/autofocus)
- **input-mask** — маски форматирования для текстовых полей ввода. [docs](https://primitives.solidjs.community/package/input-mask/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/input-mask)
- **keyboard** — обработка клавиатурных событий и комбинаций клавиш. [docs](https://primitives.solidjs.community/package/keyboard/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard)
- **mouse** — реактивное отслеживание позиции и взаимодействий мыши. [docs](https://primitives.solidjs.community/package/mouse/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/mouse)
- **pointer** — унифицированные pointer-события по устройствам (мышь/тач/перо). [docs](https://primitives.solidjs.community/package/pointer/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/pointer)
- **scroll** — реактивное чтение и управление позицией скролла. [docs](https://primitives.solidjs.community/package/scroll/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/scroll)
- **selection** — работа с выделением текста на странице. [docs](https://primitives.solidjs.community/package/selection/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/selection)
- **gestures** — директивы для жестов пользователя (свайп/пинч/…), порт с `svelte-gestures`. [docs](https://primitives.solidjs.community/package/gestures/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/gestures)

## Display & Media

- **audio** — создание и управление воспроизведением аудио. [docs](https://primitives.solidjs.community/package/audio/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/audio)
- **bounds** — реактивные размеры и позиция элемента. [docs](https://primitives.solidjs.community/package/bounds/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/bounds)
- **devices** — доступ к списку устройств (камера/микрофон/сенсоры) и медиапотокам. [docs](https://primitives.solidjs.community/package/devices/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/devices)
- **filesystem** — чтение/запись файлов через разные адаптеры. [docs](https://primitives.solidjs.community/package/filesystem/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/filesystem)
- **idle** — детекция бездействия пользователя. [docs](https://primitives.solidjs.community/package/idle/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/idle)
- **intersection-observer** — реактивное наблюдение за видимостью элемента. [docs](https://primitives.solidjs.community/package/intersection-observer/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/intersection-observer)
- **media** — реактивные media-запросы (`matchMedia`). [docs](https://primitives.solidjs.community/package/media/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/media)
- **page-visibility** — отслеживание видимости вкладки/страницы. [docs](https://primitives.solidjs.community/package/page-visibility/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/page-visibility)
- **resize-observer** — реактивное наблюдение за изменением размера элемента. [docs](https://primitives.solidjs.community/package/resize-observer/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/resize-observer)
- **styles** — реактивный доступ к вычисленным CSS-значениям. [docs](https://primitives.solidjs.community/package/styles/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/styles)

## Browser APIs

- **broadcast-channel** — обмен сообщениями между вкладками браузера. [docs](https://primitives.solidjs.community/package/broadcast-channel/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/broadcast-channel)
- **clipboard** — операции копирования/вставки. [docs](https://primitives.solidjs.community/package/clipboard/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/clipboard)
- **event-listener** — реактивное управление обработчиками событий. [docs](https://primitives.solidjs.community/package/event-listener/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener)
- **event-props** — реактивные пропсы-обработчики событий. [docs](https://primitives.solidjs.community/package/event-props/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-props)
- **fullscreen** — управление полноэкранным режимом. [docs](https://primitives.solidjs.community/package/fullscreen/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/fullscreen)
- **mutation-observer** — реактивное отслеживание изменений DOM. [docs](https://primitives.solidjs.community/package/mutation-observer/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/mutation-observer)
- **permission** — проверка разрешений браузерных API. [docs](https://primitives.solidjs.community/package/permission/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/permission)
- **storage** — реактивный доступ к persistent-хранилищам (`localStorage`/`sessionStorage`/cookies/IndexedDB/Tauri/кастом), с синхронизацией между вкладками и клиент-сервер. [docs](https://primitives.solidjs.community/package/storage/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/storage)
- **timer** — планирование колбэков на сигналах. [docs](https://primitives.solidjs.community/package/timer/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/timer)
- **upload** — обработка загрузки файлов и drag-and-drop. [docs](https://primitives.solidjs.community/package/upload/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/upload)
- **workers** — создание и работа с Web Worker'ами. [docs](https://primitives.solidjs.community/package/workers/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/workers)

## Network

- **connectivity** — мониторинг статуса интернет-соединения. [docs](https://primitives.solidjs.community/package/connectivity/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/connectivity)
- **cookies** — управление HTTP-cookies. [docs](https://primitives.solidjs.community/package/cookies/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/cookies)
- **fetch** — реактивные HTTP-запросы. [docs](https://primitives.solidjs.community/package/fetch/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/fetch)
- **graphql** — GraphQL-клиент с реактивными запросами. [docs](https://primitives.solidjs.community/package/graphql/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/graphql)
- **sse** — работа с Server-Sent Events. [docs](https://primitives.solidjs.community/package/sse/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/sse)
- **stream** — работа с медиапотоками. [docs](https://primitives.solidjs.community/package/stream/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/stream)
- **websocket** — WebSocket-коммуникация. [docs](https://primitives.solidjs.community/package/websocket/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/websocket)

## Control Flow

> `keyed` из этого раздела **взят** и в очереди больше не стоит — [`keyed.md`](./keyed.md).

- **context** — создание и предоставление значений контекста. [docs](https://primitives.solidjs.community/package/context/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/context)
- **jsx-tokenizer** — токенизация JSX-контента (для нестандартных рендер-паттернов). [docs](https://primitives.solidjs.community/package/jsx-tokenizer/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/jsx-tokenizer)
- **list** — альтернатива `<For>`/`<Index>` с реактивным значением и реактивным индексом элемента. [docs](https://primitives.solidjs.community/package/list/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/list)
- **match** — компоненты паттерн-матчинга. [docs](https://primitives.solidjs.community/package/match/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/match)
- **range** — генерация числовых диапазонов. [docs](https://primitives.solidjs.community/package/range/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/range)
- **refs** — управление ссылками на элементы/компоненты. [docs](https://primitives.solidjs.community/package/refs/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/refs)

## Utilities

- **controlled-props** — синхронизация controlled/uncontrolled пропсов. [docs](https://primitives.solidjs.community/package/controlled-props/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/controlled-props)
- **cursor** — смена стиля курсора мыши. [docs](https://primitives.solidjs.community/package/cursor/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/cursor)
- **date** — работа с датами и разницей во времени. [docs](https://primitives.solidjs.community/package/date/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/date)
- **event-bus** — publish-subscribe система событий. [docs](https://primitives.solidjs.community/package/event-bus/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-bus)
- **event-dispatcher** — диспатч кастомных событий. [docs](https://primitives.solidjs.community/package/event-dispatcher/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-dispatcher)
- **flux-store** — стейт-менеджмент по Flux-паттерну. [docs](https://primitives.solidjs.community/package/flux-store/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/flux-store)
- **history** — undo/redo функциональность. [docs](https://primitives.solidjs.community/package/history/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/history)
- **i18n** — поддержка интернационализации. [docs](https://primitives.solidjs.community/package/i18n/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/i18n)
- **platform** — определение браузера и ОС. [docs](https://primitives.solidjs.community/package/platform/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/platform)
- **promise** — утилиты для работы с промисами. [docs](https://primitives.solidjs.community/package/promise/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/promise)
- **props** — объединение и фильтрация пропсов компонента. [docs](https://primitives.solidjs.community/package/props/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/props)
- **scheduled** — debounce/throttle и планирование вызовов функций. [docs](https://primitives.solidjs.community/package/scheduled/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled)
- **script-loader** — динамическая загрузка внешних скриптов. [docs](https://primitives.solidjs.community/package/script-loader/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/script-loader)
- **share** — соцшеринг и Web Share API. [docs](https://primitives.solidjs.community/package/share/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/share)
- **analytics** — трекинг аналитики с очередью диспатча, реактивными сигналами, шарингом контекста и navigation guards; плагины (Google Analytics, Segment, Amplitude, Mixpanel, …) не вшиты, подключаются отдельно. [docs](https://primitives.solidjs.community/package/analytics/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/analytics)
- **utils** — базовые реактивные типы и хелперы, на которых построены другие примитивы пакета (служебный, напрямую редко нужен). [docs](https://primitives.solidjs.community/package/utils/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/utils)

## Reactivity

- **db-store** — реактивная привязка данных к базам данных. [docs](https://primitives.solidjs.community/package/db-store/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/db-store)
- **deep** — глубокое реактивное отслеживание и обновление вложенных структур. [docs](https://primitives.solidjs.community/package/deep/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/deep)
- **destructure** — безопасная деструктуризация реактивных объектов без потери реактивности. [docs](https://primitives.solidjs.community/package/destructure/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/destructure)
- **immutable** — неизменяемые реактивные структуры данных. [docs](https://primitives.solidjs.community/package/immutable/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/immutable)
- **lifecycle** — дополнительный слой lifecycle-примитивов поверх Solid. [docs](https://primitives.solidjs.community/package/lifecycle/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/lifecycle)
- **map** — реактивные `Map`/`WeakMap`. [docs](https://primitives.solidjs.community/package/map/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/map)
- **memo** — продвинутые паттерны мемоизации. [docs](https://primitives.solidjs.community/package/memo/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/memo)
- **mutable** — создание мутабельных реактивных объектов. [docs](https://primitives.solidjs.community/package/mutable/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/mutable)
- **resource** — продвинутое управление ресурсами и кэшем поверх `createResource`. [docs](https://primitives.solidjs.community/package/resource/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/resource)
- **rootless** — хелперы для использования реактивных примитивов вне реактивного root'а. [docs](https://primitives.solidjs.community/package/rootless/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless)
- **set** — реактивные `Set`/`WeakSet`. [docs](https://primitives.solidjs.community/package/set/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/set)
- **signal-builders** — набор цепочечных (chainable) реактивных вычислений над сигналами. [docs](https://primitives.solidjs.community/package/signal-builders/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/signal-builders)
- **state-machine** — реализация конечного автомата. [docs](https://primitives.solidjs.community/package/state-machine/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/state-machine)
- **static-store** — нереактивные (статические) стора. [docs](https://primitives.solidjs.community/package/static-store/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/static-store)
- **trigger** — ручные (manual) реактивные триггеры. [docs](https://primitives.solidjs.community/package/trigger/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/trigger)

## UI Patterns

- **marker** — разметка и ссылки на конкретные позиции (например, для подсветки текста). [docs](https://primitives.solidjs.community/package/marker/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/marker)
- **masonry** — раскладка masonry-сеткой. [docs](https://primitives.solidjs.community/package/masonry/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/masonry)
- **pagination** — пагинация данных и бесконечный скролл. [docs](https://primitives.solidjs.community/package/pagination/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/pagination)
- **virtual** — виртуальный скролл для больших списков. [docs](https://primitives.solidjs.community/package/virtual/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/virtual)

## Animation

- **presence** — анимация монтирования/размонтирования компонента. [docs](https://primitives.solidjs.community/package/presence/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/presence)
- **raf** — утилиты поверх `requestAnimationFrame`. [docs](https://primitives.solidjs.community/package/raf/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/raf)
- **spring** — физически-обоснованные spring-анимации. [docs](https://primitives.solidjs.community/package/spring/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/spring)
- **transition-group** — анимация переходов для списков. [docs](https://primitives.solidjs.community/package/transition-group/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/transition-group)
- **tween** — интерполяция значений во времени. [docs](https://primitives.solidjs.community/package/tween/) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/tween)

## Рассмотренные, но не выбранные альтернативы

- **[solidjs-hooks](https://github.com/NukeJS/solidjs-hooks)** (NukeJS) — небольшая личная коллекция
  хуков, заметно меньше и не так активно живёт, как `solid-primitives`.
- **solid-use** — попытка портировать идею VueUse на Solid, тоже сильно уступает по охвату и
  активности `solid-primitives`.

Формы (`modular-forms`/`formisch`) не разбирал подробно — у кита уже есть свой `@web-core/form`,
это отдельный вопрос, не про этот файл.
