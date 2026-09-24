# 🧭 Navigation Menu

<h2 id="главное">🏠 Главное</h2>

🏷️ navigation · 🧬 component · 📐 wide · 📦 `@web-core/ui`

Полоса разделов сайта 🧭 — каждый раздел раскрывает под собой панель. Раскрывается наведением и
нажатием, раскрыт всегда ровно один раздел, закрывается `Esc` и уходом указателя.

Что внутри панели — не забота меню: это слот, который наполняет потребитель. Переходами по
адресам меню не занимается вовсе — их ведёт приложение своим роутером. Настоящая ссылка
(`NavigationMenuLink`) в ките есть и собирается руками, когда в разметке правда нужен `<a>`.

Панель живёт одним из двух способов, и это выбор сборки, а не настройка: своя панель у каждого
раздела (`basic`) или одна общая на всё меню, в которую содержимое переезжает и подстраивает
размер под раскрытый раздел (`viewport`).

<h2 id="анатомия">🧩 Анатомия</h2>

```
root
├─ list
│  ├─ item[]
│  │  ├─ trigger        (подпись + значок)
│  │  │  └─ itemIndicator
│  │  ├─ content
│  │  │  └─ link[]
│  │  └─ link
│  └─ indicator
│     └─ arrow
└─ viewportPositioner
   └─ viewport
```

| часть | значение | принимает внутри | рисуется |
| --- | --- | --- | --- |
| ⬜ `root` | всё меню целиком — полоса разделов вместе с раскрытой панелью | `list`, `viewportPositioner` | `NavigationMenu` |
| ➖ `list` | полоса (или столбец) разделов | `item`, `indicator` | `NavigationMenuList` |
| 🗂️ `item` | один раздел — кнопка с панелью или сразу ссылка | `trigger`, `content`, `link` | `NavigationMenuItem` |
| 🔘 `trigger` | кнопка раздела — раскрывает панель наведением или нажатием | текст, иконку, любой компонент кита | `NavigationMenuTrigger` |
| 🔽 `itemIndicator` | пометка раскрытого раздела — в разметке существует ТОЛЬКО пока раздел раскрыт | иконку | `NavigationMenuItemIndicator` |
| 📄 `content` | панель раздела — место под ссылки и что угодно ещё | `link`, любой компонент | `NavigationMenuContent` |
| 🔗 `link` | ссылка — уводит на адрес; живёт и в панели, и прямо в полосе | текст, иконку | `NavigationMenuLink` |
| ▬ `indicator` | скользящий указатель под раскрытым разделом | `arrow` | `NavigationMenuIndicator` |
| 🔺 `arrow` | клин от панели к раскрытому разделу — просто бокс, своего графика не несёт | — | `NavigationMenuArrow` |
| 📐 `viewportPositioner` | место, где стоит общая панель | `viewport` | `NavigationMenuViewportPositioner` |
| 🪟 `viewport` | общая панель — одна на всё меню, содержимое раскрытого раздела переезжает в неё | — | `NavigationMenuViewport` |

> [!NOTE]
> Раскладка файлов повторяет владение: части одного раздела лежат в `components/item/`, клин — в
> `components/indicator/`, рядом с тем, внутри чего он и существует.
>
> Значок-стрелка в кнопке — обычная иконка, а НЕ `itemIndicator`: вторую машина показывает только
> для раскрытого раздела, и в потоке кнопки она раздвигала бы её при каждом раскрытии (разбор и
> замер — в [`FAQ.md`](./FAQ.md)).

<h2 id="использование">🚀 Использование</h2>

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.

```tsx
<NavigationMenu>
  <NavigationMenuList>
    <NavigationMenuItem value="products">
      <NavigationMenuTrigger>
        Продукты
        <Icon name="chevron-down" />
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="#analytics">Аналитика</NavigationMenuLink>
        <NavigationMenuLink href="#payments">Платежи</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>

    <NavigationMenuItem value="docs">
      <NavigationMenuLink href="#docs">Документация</NavigationMenuLink>
    </NavigationMenuItem>

    <NavigationMenuIndicator />
  </NavigationMenuList>
</NavigationMenu>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует
`RenderTree`.

```tsx
const data = {
  items: [
    { value: "products", label: "Продукты" },
    { value: "resources", label: "Ресурсы" },
  ],
};
const tree = instanceOf("navigation-menu", {}, "basic", data);

<RenderTree
  tree={tree}
  registry={registry}
  data={data}
  slots={{ "navigation-menu.content": { render: () => <ProductsPanel /> } }}
/>;
```

> [!IMPORTANT]
> Сборка даёт полосу разделов и ПУСТУЮ панель — что внутри, решает потребитель, и кит за него не
> решает. Ссылок в сборке нет намеренно: переход по адресу — дело приложения с его роутером, а не
> меню (разбор — в [`FAQ.md`](./FAQ.md)). `NavigationMenuLink` при этом никуда не делся: он часть
> кита и собирается руками там, где нужен настоящий `<a>`.

**Раздел без панели** — внутри раздела стоит сразу ссылка, кнопки и панели у него нет вовсе.

```tsx
<NavigationMenuItem value="docs">
  <NavigationMenuLink href="#docs">Документация</NavigationMenuLink>
</NavigationMenuItem>
```

**Текущий адрес** — `current` помечает ссылку, ведущую туда, где мы уже находимся; она же
получает `aria-current="page"`.

```tsx
<NavigationMenuLink href="#analytics" current>
  Аналитика
</NavigationMenuLink>
```

**Только по нажатию** — `disableHoverTrigger` убирает раскрытие наведением, остаётся клик и
клавиатура.

```tsx
<NavigationMenu disableHoverTrigger>{/* … */}</NavigationMenu>
```

**Задержки** — `openDelay`/`closeDelay` задают, сколько меню ждёт, прежде чем раскрыться и
закрыться по указателю.

```tsx
<NavigationMenu openDelay={200} closeDelay={300}>{/* … */}</NavigationMenu>
```

**Общая панель** — `viewportPositioner` с `viewport` рядом со списком; содержимое каждого раздела
переезжает в эту одну панель, а она подстраивает размер под то, что в ней сейчас.

```tsx
<NavigationMenu>
  <NavigationMenuList>{/* … */}</NavigationMenuList>
  <NavigationMenuViewportPositioner align="start">
    <NavigationMenuViewport />
  </NavigationMenuViewportPositioner>
</NavigationMenu>
```

<h2 id="настройки">🎚️ Настройки</h2>

| настройка | значения | по умолчанию | означает |
| --- | --- | --- | --- |
| `orientation` | `horizontal`/`vertical` | `horizontal` | как расположены разделы — влияет на навигацию с клавиатуры и aria, не только на вид |

<h2 id="состояния">🎛️ Состояния</h2>

|  | часть | состояние | метка | значение |
| --- | --- | --- | --- | --- |
| 📂 | item, trigger, content, indicator, itemIndicator, viewport | open | `[data-state="open"]` | раздел раскрыт (у `indicator`/`viewport` — раскрыт хоть какой-то) |
| 📁 | item, trigger, content, indicator, itemIndicator, viewport | closed | `[data-state="closed"]` | раздел закрыт |
| 🚫 | item, trigger | disabled | `[data-disabled]` | раздел нельзя раскрыть |
| 📍 | link | current | `[data-current]` | ссылка ведёт туда, где мы сейчас |
| 🖱️ | trigger, link | hover | `:hover` | указатель наведён |
| ⌨️ | trigger, link | focus-visible | `:focus-visible` | фокус пришёл с клавиатуры — при клике мышью это было бы шумом |
| 👆 | trigger, link | active | `:active` | нажато и удерживается |

> [!NOTE]
> `content`, `indicator`, `itemIndicator` и `viewport` в закрытом виде прячет НАТИВНЫЙ `hidden`, а
> не правило скина. Поэтому `display` этим частям выдаётся только внутри состояния `open` —
> безусловный `display` в базовых пропсах перебил бы `[hidden] { display: none }` браузера
> специфичностью, и закрытая панель осталась бы видимой (общее правило — `web-core/ui/README.md`).
>
> `data-value`/`data-uid`/`data-ownedby` на частях — не состояния: первое называет, КАКОЙ это
> раздел, остальные два — проводка между кнопкой и её панелью.

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

```json
{
  "items": [{ "value": "string", "label": "string" }]
}
```

Данные меню — только сами разделы: подпись на кнопке и ключ, по которому машина понимает, какой
раздел раскрыт. Содержимого панелей в данных нет вовсе — его кладёт потребитель.

<h3 id="io-выход">📤 Выход</h3>

Меню ничего не диспатчит через сборку — раскрытием управляет собственная машина состояний, а
событиями внутри панели распоряжается тот, кто панель наполнил. В ручной сборке смену раскрытого
раздела отдаёт `onValueChange`.

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-basic">🧱 basic</h3>

```
root
  list
    item[] · repeat: /items · bind: value
      trigger · text: {label} + icon: "chevron-down"
      content · пустой слот под содержимое потребителя
    indicator
```

<h3 id="сборка-viewport">🪟 viewport</h3>

Те же разделы, но с общей панелью: у указателя появляется клин, а рядом со списком встаёт
`viewportPositioner` с `viewport` внутри.

```
root
  list
    item[] · repeat: /items · bind: value
      trigger · text: {label} + icon: "chevron-down"
      content · пустой слот под содержимое потребителя
    indicator
      arrow
  viewportPositioner · align: "start"
    viewport
```

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.

Указатель едет по измеренным `--trigger-width`/`--trigger-x` (в вертикальной ориентации —
`--trigger-height`/`--trigger-y`), но объявлены эти переменные на `root`, а не на самом
указателе: измеряет их машина и пишет наверх. Поэтому правило берёт их через явно названного
предка (`ancestors`), а не надеется на CSS-наследование — проверка скина такой надежды не
засчитывает.

Размер общей панели — `--viewport-width`/`--viewport-height` на самой части `viewport`: она
подстраивается под содержимое раскрытого раздела, и переход между разделами анимируется именно
изменением этих величин.

> [!NOTE]
> `content` в этом рецепте несёт вид всплывающей панели (фон, рамка, тень) — отступление от общего
> правила «часть под чужое содержимое своих стилей не несёт», разобранное в [`FAQ.md`](./FAQ.md).

<h2 id="доступность">♿ Доступность</h2>

Меню следует паттерну WAI-ARIA [Disclosure Navigation
Menu](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/). Кнопка раздела несёт `aria-expanded`
и `aria-controls` на свою панель, панель — `aria-labelledby` на свою кнопку, ссылка текущего
адреса — `aria-current="page"`. Указатель и клин декоративны (`aria-hidden`).

| Клавиша | Действие |
| --- | --- |
| `Tab` | Фокус на полосу разделов; из раскрытой панели — по её содержимому |
| `ArrowLeft` / `ArrowRight` | Переносит фокус между разделами (в горизонтальной ориентации) |
| `ArrowUp` / `ArrowDown` | То же в вертикальной; `ArrowDown` на раскрытой кнопке входит в панель |
| `Home` / `End` | Переносит фокус на первый / последний раздел |
| `Enter` / `Space` | Раскрывает раздел под фокусом |
| `Esc` | Закрывает раскрытый раздел |
