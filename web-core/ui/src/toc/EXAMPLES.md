# 🧪 Примеры — как работать с `Toc`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — контент и навигация по нему

Самый простой путь: JSX-композиция, без схемы и движка. Оглавление НЕ рисует контент — оно следит
за настоящими заголовками, которые положил потребитель, и находит их по `id`, совпадающему с
`value` пункта.

```tsx
import { For } from "@web-core/solid";
import {
  Toc,
  TocContent,
  TocIndicator,
  TocItem,
  TocLink,
  TocList,
  TocNav,
  TocTitle,
} from "@web-core/ui";

const items = [
  { value: "intro", depth: 2, label: "Введение", href: "#intro" },
  { value: "install", depth: 2, label: "Установка", href: "#install" },
  { value: "flags", depth: 3, label: "Флаги", href: "#flags" },
];

export function BasicTocDemo() {
  return (
    <Toc data-variant="xxx" items={items}>
      <TocContent>
        <h2 id="intro">Введение</h2>
        <p>…</p>
        <h2 id="install">Установка</h2>
        <p>…</p>
        <h3 id="flags">Флаги</h3>
        <p>…</p>
      </TocContent>

      <TocNav>
        <TocTitle>На этой странице</TocTitle>
        <TocList>
          <TocIndicator />
          <For each={items}>
            {(item) => (
              <TocItem item={item}>
                <TocLink href={item.href}>{item.label}</TocLink>
              </TocItem>
            )}
          </For>
        </TocList>
      </TocNav>
    </Toc>
  );
}
```

Полезно проверить: `href` берётся из данных ГОТОВЫМ (`"#intro"`), кит его не склеивает из `value` —
схема строк не собирает ([`FAQ.md`](./FAQ.md)). Ссылка настоящая: открыть в новой вкладке и
скопировать адрес работает как у обычного `<a>`, а обычный клик подменяется плавным скроллом.

## 2. Вложенность заголовков

`depth` — уровень заголовка из данных. Отступ пункта считает рецепт от этого числа, а не от
структуры списка: список плоский, вложенность выражена числом.

```tsx
const items = [
  { value: "api", depth: 2, label: "API", href: "#api" },
  { value: "api-get", depth: 3, label: "get()", href: "#api-get" },
  { value: "api-set", depth: 3, label: "set()", href: "#api-set" },
  { value: "faq", depth: 2, label: "Вопросы", href: "#faq" },
];
```

Полезно проверить: на пункте появляется `--depth` из данных; отступ в проверочном рецепте считается
как `calc((var(--depth) - 2) * var(--space-3))` — двойка потому, что `h2` обычно самый верхний
уровень страницы. Свои уровни — своя формула в своей форме скина.

## 3. Активный пункт — и почему их может быть несколько

Какой заголовок сейчас на виду, оглавление решает само. Управляемый режим (`activeIds`) нужен,
когда это решает потребитель — и он же единственный способ проверить подсветку в тесте: в jsdom
`IntersectionObserver` подменён заглушкой, настоящего пересечения там взяться неоткуда.

```tsx
import { createSignal, For } from "@web-core/solid";
import { Toc, TocContent, TocItem, TocLink, TocList, TocNav } from "@web-core/ui";

const items = [
  { value: "intro", depth: 2, label: "Введение", href: "#intro" },
  { value: "install", depth: 2, label: "Установка", href: "#install" },
];

export function ControlledTocDemo() {
  const [active, setActive] = createSignal(["install"]);

  return (
    <>
      <button type="button" onClick={() => setActive(["intro"])}>
        Подсветить «Введение» снаружи
      </button>

      <Toc data-variant="xxx" items={items} activeIds={active()}>
        <TocContent>
          <h2 id="intro">Введение</h2>
          <h2 id="install">Установка</h2>
        </TocContent>

        <TocNav>
          <TocList>
            <For each={items}>
              {(item) => (
                <TocItem item={item}>
                  <TocLink href={item.href}>{item.label}</TocLink>
                </TocItem>
              )}
            </For>
          </TocList>
        </TocNav>
      </Toc>
    </>
  );
}
```

Полезно проверить: `[data-active]` появляется и на `item`, и на его `link`, а у ссылки вдобавок
`aria-current="location"`. Видимых заголовков может быть НЕСКОЛЬКО сразу (короткие секции, широкая
зона наблюдения) — тогда `[data-first]`/`[data-last]` помечают края этой группы, а не единственный
активный пункт.

## 4. Слежение за своим контейнером, а не за всей страницей

По умолчанию оглавление смотрит на весь документ. `scrollEl` сужает наблюдение до конкретного
прокручиваемого контейнера — это функция-ref, поэтому задаётся только ручной композицией: через
схему такое не передать, `bind` резолвит лишь сериализуемые значения.

```tsx
import { For } from "@web-core/solid";
import { Toc, TocContent, TocItem, TocLink, TocList, TocNav } from "@web-core/ui";

const items = [{ value: "intro", depth: 2, label: "Введение", href: "#intro" }];

export function ScopedTocDemo() {
  let box!: HTMLDivElement;

  return (
    <Toc data-variant="xxx" items={items} scrollEl={() => box}>
      <div ref={box} style={{ height: "300px", overflow: "auto" }}>
        <TocContent>
          <h2 id="intro">Введение</h2>
          <p>…длинный текст…</p>
        </TocContent>
      </div>

      <TocNav>
        <TocList>
          <For each={items}>
            {(item) => (
              <TocItem item={item}>
                <TocLink href={item.href}>{item.label}</TocLink>
              </TocItem>
            )}
          </For>
        </TocList>
      </TocNav>
    </Toc>
  );
}
```

Полезно проверить: прокрутка страницы больше не меняет активный пункт, а прокрутка внутри
контейнера — меняет. Живьём, не в jsdom: там слежение не работает в принципе.

## 5. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Пункты приезжают из данных
(`/items` по io-схеме), а `content` остаётся ПУСТЫМ слотом: настоящие заголовки схема за
потребителя не выдумывает.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineTocDemo() {
  const data = {
    items: [
      { value: "intro", depth: 2, label: "Введение", href: "#intro" },
      { value: "install", depth: 2, label: "Установка", href: "#install" },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("toc", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
      slots={{
        "toc.content": {
          placement: "replace",
          render: () => (
            <>
              <h2 id="intro">Введение</h2>
              <h2 id="install">Установка</h2>
            </>
          ),
        },
      }}
    />
  );
}
```

Полезно проверить: подписи, `href` и `data-depth` в разметке совпадают с данными, а заголовки
приходят слотом — без него список ссылок будет вести в никуда, потому что искать по `id` нечего.
Событий оглавление наружу схемы не отдаёт: клик по ссылке — настоящий переход и настоящий скролл.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: панель, отступы уровней и скользящий указатель
приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со
скином.

Деталь для авторов форм: геометрию указателя (`--left`/`--top`/`--width`/`--height`) машина пишет
на КОРЕНЬ, а не на сам указатель — в отличие от табов и радио-группы. В рецепте её берут через
`ancestors`, явно называя `root`. Полный рабочий прогон — `test/toc.test.tsx`.
