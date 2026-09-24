# 🧪 Примеры — как работать с `NavigationMenu`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

Кит не несёт ни одного стиля по умолчанию, поэтому голое меню в браузере выглядит как столбик
текста: панель раздела позиционируется рецептом скина, а не самим компонентом. Чтобы примеры было
видно глазами, либо надевайте наряд, либо накидывайте свой минимум инлайном — в
примере 1 это показано.

## 1. Ручная сборка — базовое меню

Самый простой путь: JSX-композиция, без схемы и движка. Два раздела с панелями, один раздел —
сразу ссылка, и скользящий указатель под раскрытым.

```tsx
import { For } from "@web-core/solid";
import {
  Icon,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@web-core/ui";

const sections = [
  {
    value: "products",
    label: "Продукты",
    links: [
      { label: "Аналитика", href: "#analytics" },
      { label: "Платежи", href: "#payments" },
      { label: "Коммерция", href: "#commerce" },
    ],
  },
  {
    value: "resources",
    label: "Ресурсы",
    links: [
      { label: "Блог", href: "#blog" },
      { label: "Changelog", href: "#changelog" },
    ],
  },
];

export function BasicNavigationMenuDemo() {
  return (
    <NavigationMenu style={{ position: "relative", width: "max-content" }}>
      <NavigationMenuList style={{ display: "flex", gap: "4px", position: "relative" }}>
        <For each={sections}>
          {(section) => (
            <NavigationMenuItem value={section.value} style={{ position: "static" }}>
              <NavigationMenuTrigger>
                {section.label}
                <Icon name="chevron-down" />
              </NavigationMenuTrigger>
              <NavigationMenuContent
                style={{ position: "absolute", top: "100%", left: "0", background: "white", border: "1px solid #ddd" }}
              >
                <For each={section.links}>
                  {(link) => <NavigationMenuLink href={link.href}>{link.label}</NavigationMenuLink>}
                </For>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )}
        </For>

        <NavigationMenuItem value="docs">
          <NavigationMenuLink href="#docs">Документация</NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuIndicator style={{ position: "absolute", bottom: "0", height: "2px", background: "black" }} />
      </NavigationMenuList>
    </NavigationMenu>
  );
}
```

Полезно проверить: наведение на «Продукты» раскрывает панель (у кнопки `[data-state="open"]`,
у панели пропадает `hidden`), указатель уезжает под раскрытый раздел, `Esc` закрывает, а раздел
«Документация» ведёт по адресу сразу, без всякой панели.

## 2. Общая панель — `viewport` с клином

Содержимое раскрытого раздела ФИЗИЧЕСКИ переезжает в одну панель на всё меню, и она подстраивает
размер под то, что в ней сейчас (`--viewport-width`/`--viewport-height`). Клин (`arrow`) живёт
внутри указателя и едет вместе с ним.

```tsx
import { For } from "@web-core/solid";
import {
  NavigationMenu,
  NavigationMenuArrow,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  NavigationMenuViewportPositioner,
} from "@web-core/ui";

const sections = [
  { value: "overview", label: "Обзор", links: [{ label: "Быстрый старт", href: "#quick-start" }] },
  {
    value: "guides",
    label: "Руководства",
    links: [
      { label: "Анимация", href: "#animation" },
      { label: "Композиция", href: "#composition" },
      { label: "Формы", href: "#forms" },
    ],
  },
];

export function ViewportNavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <For each={sections}>
          {(section) => (
            <NavigationMenuItem value={section.value}>
              <NavigationMenuTrigger>{section.label}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <For each={section.links}>
                  {(link) => <NavigationMenuLink href={link.href}>{link.label}</NavigationMenuLink>}
                </For>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )}
        </For>

        <NavigationMenuIndicator>
          <NavigationMenuArrow />
        </NavigationMenuIndicator>
      </NavigationMenuList>

      <NavigationMenuViewportPositioner align="start">
        <NavigationMenuViewport />
      </NavigationMenuViewportPositioner>
    </NavigationMenu>
  );
}
```

Полезно проверить: в инспекторе узел `[data-part="content"]` раскрытого раздела лежит ВНУТРИ
`[data-part="viewport"]`, а не там, где он написан в JSX; при переходе с «Обзора» на «Руководства»
панель меняет размер, а не перерисовывается скачком. `align` двигает панель относительно полосы
(`start`/`center`/`end`).

## 3. Вертикальное меню

`orientation="vertical"` — разделы столбиком, панель открывается сбоку. Настройка меняет и
навигацию с клавиатуры: вход в раскрытую панель — `ArrowRight`, а не `ArrowDown`.

```tsx
<NavigationMenu orientation="vertical">
  <NavigationMenuList>
    <NavigationMenuItem value="products">
      <NavigationMenuTrigger>Продукты</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuLink href="#analytics">Аналитика</NavigationMenuLink>
      </NavigationMenuContent>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

Полезно проверить: `[data-orientation="vertical"]` на всех частях, `ArrowUp`/`ArrowDown` ходят
между разделами, `ArrowRight` на раскрытом заходит внутрь панели.

## 4. Только по нажатию, со своими задержками

`disableHoverTrigger` убирает раскрытие наведением — остаются клик и клавиатура.
`openDelay`/`closeDelay` меняют, сколько меню ждёт указателя (по умолчанию 200 мс и 300 мс), а
`disablePointerLeaveClose` оставляет панель раскрытой, даже когда указатель ушёл.

```tsx
<NavigationMenu disableHoverTrigger>{/* … */}</NavigationMenu>

<NavigationMenu openDelay={0} closeDelay={1000}>{/* … */}</NavigationMenu>

<NavigationMenu disablePointerLeaveClose>{/* … */}</NavigationMenu>
```

Полезно проверить: с `disableHoverTrigger` наведение не раскрывает вообще ничего, а клик
раскрывает; с `closeDelay={1000}` панель живёт ещё секунду после ухода указателя — успеваешь
довести курсор до ссылки по диагонали.

## 5. Текущий адрес и перехват выбора ссылки

`current` помечает ссылку, ведущую туда, где мы уже находимся (плюс `aria-current="page"`).
`onSelect` даёт перехватить выбор — например, увести переход в свой роутер; `closeOnClick={false}`
оставляет панель раскрытой после клика.

```tsx
import { NavigationMenuContent, NavigationMenuLink } from "@web-core/ui";

export function CurrentLinkDemo(props: { path: string; navigate: (to: string) => void }) {
  return (
    <NavigationMenuContent>
      <NavigationMenuLink
        href="/analytics"
        current={props.path === "/analytics"}
        onSelect={(event) => {
          event.preventDefault();
          props.navigate("/analytics");
        }}
      >
        Аналитика
      </NavigationMenuLink>

      <NavigationMenuLink href="/payments" closeOnClick={false}>
        Платежи — панель останется раскрытой
      </NavigationMenuLink>
    </NavigationMenuContent>
  );
}
```

Полезно проверить: у текущей ссылки `[data-current]` и `aria-current="page"`; `preventDefault()` в
`onSelect` оставляет меню раскрытым (закрытие отменено вместе с выбором), а без него панель
закрывается сама. Ссылка с `closeOnClick={false}` не закрывает панель никогда.

## 6. Управление снаружи — `value` + `onValueChange`

Раскрытый раздел можно держать в своём сигнале: `value` — то, что раскрыто сейчас, пустая строка —
закрыто всё. Наружу меню отдаёт обычную строку, а не объект подробностей.

```tsx
import { createSignal } from "@web-core/solid";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@web-core/ui";

export function ControlledNavigationMenuDemo() {
  const [open, setOpen] = createSignal("");

  return (
    <div>
      <button onClick={() => setOpen("products")}>Раскрыть «Продукты» снаружи</button>
      <button onClick={() => setOpen("")}>Закрыть всё</button>
      <output>раскрыт: {open() || "ничего"}</output>

      <NavigationMenu value={open()} onValueChange={setOpen}>
        <NavigationMenuList>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger>Продукты</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#analytics">Аналитика</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem value="resources" disabled>
            <NavigationMenuTrigger>Ресурсы (выключен)</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#blog">Блог</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
```

Полезно проверить: кнопки снаружи реально раскрывают и закрывают меню, `<output>` живёт в такт
наведению мышью (меню сообщает о каждой своей смене), а выключенный раздел не раскрывается ни
наведением, ни кликом и несёт `[data-disabled]`.

Начальное состояние без контроля — `defaultValue="products"`: меню раскрыто сразу, но дальше
управляет собой само.

## 7. Ленивое монтирование панелей

`lazyMount` рендерит содержимое панели только при первом раскрытии, `unmountOnExit` выбрасывает его
обратно при закрытии. Оба — на корне, сразу на все панели меню.

```tsx
<NavigationMenu lazyMount unmountOnExit>
  {/* … */}
</NavigationMenu>
```

Полезно проверить: до первого наведения узлов `[data-part="content"]` в разметке нет вовсе (а не
«есть, но спрятаны»); с `unmountOnExit` они исчезают снова после закрытия.

## 8. Рендер через движок

Та же композиция, что в примере 1, но собранная по схеме (сборка `basic`) и нарисованная
`RenderTree`, а не руками. Полный рабочий пример с настоящим `Registry` — `test/navigation-menu.test.tsx`
рядом. Форма схемы:

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { instanceOf } from "@web-core/skin/editor";

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
  slots={{
    "navigation-menu.content": { render: () => <SectionPanel go={(to) => router.navigate({ to })} /> },
  }}
/>;
```

Панель в сборке — пустой слот: меню даёт полосу разделов и коробку, а что в коробке, кладёт
приложение через `slots` (ключ — адрес узла, `"navigation-menu.content"`). Ссылок в схеме нет
намеренно — переход по адресу делает роутер приложения, а не меню.

Вторая сборка — `viewport`: то же дерево плюс клин у указателя и общая панель рядом со списком.
Меняется только имя в `instanceOf("navigation-menu", {}, "viewport", data)`, данные те же.

`registry` здесь — не заглушка, а настоящий `Registry` со всеми компонентами, которые могут
встретиться в дереве; собирать его вручную под один компонент нет смысла — берите готовый из
приложения, где движок сборки уже подключён.

## Подключить для живого теста

Любая dev-страница приложения:

```tsx
import { ViewportNavigationMenuDemo } from "..."; // любой пример выше

export function LabPage() {
  return <ViewportNavigationMenuDemo />;
}
```
