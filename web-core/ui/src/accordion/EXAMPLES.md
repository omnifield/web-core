# 🧪 Примеры — как работать с `Accordion`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — список разделов

Самый простой путь: JSX-композиция, без схемы и движка. Заголовок раздела оборачивается в
настоящий `<h3>` — уровень заголовка решает документ, а не кит; индикатор раскрытия кладёт
потребитель, своего значка кит не несёт.

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
} from "@web-core/ui";

export function BasicAccordionDemo() {
  return (
    <Accordion data-variant="xxx" defaultValue={["shipping"]}>
      <AccordionItem value="shipping">
        <h3>
          <AccordionControl>
            Доставка
            <AccordionControlIndicator>▾</AccordionControlIndicator>
          </AccordionControl>
        </h3>
        <AccordionContent>Курьером и самовывозом</AccordionContent>
      </AccordionItem>

      <AccordionItem value="payment">
        <h3>
          <AccordionControl>
            Оплата
            <AccordionControlIndicator>▾</AccordionControlIndicator>
          </AccordionControl>
        </h3>
        <AccordionContent>Картой, наличными, по счёту</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

Полезно проверить: `data-variant` долетел до корня как есть — по нему компонент и просит у скина
свой кусок CSS. На раскрытом разделе `[data-state="open"]` стоит на `item`, `control` и
`controlIndicator` (у `content` отметка приходит только когда реально проигрывается анимация — см.
предупреждение в [`README.md`](./README.md)); стрелки ↑/↓ переводят фокус между кнопками разделов
без единой строчки от вас.

## 2. Сразу несколько раскрытых и закрытие последнего

Две настройки, которые решают поведение гармошки целиком: `multiple` — можно держать открытыми
несколько разделов, `collapsible` — можно закрыть последний открытый и остаться совсем без
раскрытых (при включённом `multiple` уже не нужна).

```tsx
import { Accordion, AccordionContent, AccordionControl, AccordionItem } from "@web-core/ui";

export function MultipleAccordionDemo() {
  return (
    <Accordion data-variant="xxx" multiple defaultValue={["a", "b"]}>
      <AccordionItem value="a">
        <h3>
          <AccordionControl>Раздел A</AccordionControl>
        </h3>
        <AccordionContent>Открыт вместе с B</AccordionContent>
      </AccordionItem>

      <AccordionItem value="b">
        <h3>
          <AccordionControl>Раздел B</AccordionControl>
        </h3>
        <AccordionContent>И его сосед тоже открыт</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

Полезно проверить: с `multiple` оба раздела держат `[data-state="open"]` одновременно; уберите
флаг — открытие второго закроет первый. Одиночный режим БЕЗ `collapsible` не даёт закрыть
единственный открытый раздел кликом по его же кнопке, и это не баг.

## 3. Управляемое раскрытие — состояние снаружи

Какие разделы раскрыты, решает внешний сигнал: пригодится, когда это надо синхронизировать с
адресом страницы, хранилищем или соседним компонентом.

```tsx
import { createSignal } from "@web-core/solid";
import { Accordion, AccordionContent, AccordionControl, AccordionItem } from "@web-core/ui";

export function ControlledAccordionDemo() {
  const [open, setOpen] = createSignal<string[]>(["shipping"]);

  return (
    <>
      <button type="button" onClick={() => setOpen(["payment"])}>
        Открыть «Оплату» снаружи
      </button>

      <Accordion
        data-variant="xxx"
        value={open()}
        onValueChange={(details) => setOpen(details.value)}
      >
        <AccordionItem value="shipping">
          <h3>
            <AccordionControl>Доставка</AccordionControl>
          </h3>
          <AccordionContent>Курьером и самовывозом</AccordionContent>
        </AccordionItem>

        <AccordionItem value="payment">
          <h3>
            <AccordionControl>Оплата</AccordionControl>
          </h3>
          <AccordionContent>Картой, наличными, по счёту</AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
```

Полезно проверить: клик по кнопке снаружи реально раскрывает раздел — значит источник правды
сигнал, а не внутреннее состояние гармошки. `onValueChange` отдаёт `details.value` списком всегда,
даже в одиночном режиме (там это список из одного значения или пустой).

## 4. Горизонтальная ориентация

Разделы идут не сверху вниз, а слева направо. Это не только CSS: меняется клавиатурная навигация
(стрелки ←/→ вместо ↑/↓) и aria, а анимация раскрытия переключается с высоты на ширину.

```tsx
import { Accordion, AccordionContent, AccordionControl, AccordionItem } from "@web-core/ui";

export function HorizontalAccordionDemo() {
  return (
    <Accordion data-variant="xxx" orientation="horizontal" defaultValue={["a"]}>
      <AccordionItem value="a">
        <h3>
          <AccordionControl>Лента A</AccordionControl>
        </h3>
        <AccordionContent>Раскрывается вбок</AccordionContent>
      </AccordionItem>

      <AccordionItem value="b">
        <h3>
          <AccordionControl>Лента B</AccordionControl>
        </h3>
        <AccordionContent>И этот тоже</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

Полезно проверить: на корне появился `data-orientation="horizontal"`, и фокус между кнопками
переводят стрелки влево/вправо. Отдельного «горизонтального вида» заводить не нужно — рецепт
смотрит на ту же настройку.

## 5. Тяжёлое содержимое — монтировать позже, снимать при закрытии

`lazyMount` не строит содержимое, пока раздел не раскрыли хотя бы раз; `unmountOnExit` убирает его
из DOM обратно при закрытии. Оба флага живут на корне и действуют на все разделы сразу.

```tsx
import { Accordion, AccordionContent, AccordionControl, AccordionItem } from "@web-core/ui";

export function LazyAccordionDemo() {
  return (
    <Accordion data-variant="xxx" lazyMount unmountOnExit>
      <AccordionItem value="report">
        <h3>
          <AccordionControl>Тяжёлый отчёт</AccordionControl>
        </h3>
        <AccordionContent>
          <ExpensiveReport />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

Полезно проверить: до первого клика узла `[data-part="content"]` в документе нет вовсе, после
закрытия он снова исчезает. Без флагов содержимое живёт в DOM всегда, просто скрытое — что дешевле
для анимации и дороже для тяжёлого содержимого.

## 6. Рендер через движок — сборка `base`

Та же гармошка, но собранная по схеме и нарисованная `RenderTree`. Разделы приезжают из данных
(`/items` по io-схеме, канонический `item` — `value`/`label`), содержимое базовая сборка оставляет
пустым: что показывать внутри, автор компонента за потребителя не решает.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineAccordionDemo() {
  const data = {
    items: [
      { value: "shipping", label: "Доставка" },
      { value: "payment", label: "Оплата" },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("accordion", { "data-variant": "xxx" }, "base", data)}
      registry={registry}
      data={data}
      dispatch={(event) => console.log(event.name, event.context)}
    />
  );
}
```

Полезно проверить: в разметке ровно два `control` с подписями из данных и два ПУСТЫХ `content`;
клик по кнопке раздела отдаёт событие `triggerClick`, а в `context.payload` лежит строка данных
целиком (`{ value, label }`), не только её ключ.

## 7. Своё содержимое в схемный раздел — через слот

Дерево остаётся схемным, но узел `content` рисует живой компонент из кода. Слот получает
разрешённые данные своего узла — то есть у каждого раздела своё, а не одно на всех.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function SlotAccordionDemo() {
  const data = {
    items: [
      { value: "contour", label: "контурная" },
      { value: "solid", label: "сплошная" },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("accordion", { "data-variant": "xxx" }, "base", data)}
      registry={registry}
      data={data}
      slots={{
        "accordion.content": {
          render: (resolved) => <ShapePreview name={String(resolved.variant)} />,
          placement: "replace",
        },
      }}
    />
  );
}
```

Полезно проверить: разделы получают РАЗНОЕ содержимое — каждый своё, по своим данным. Ключ слота —
`"<компонент>.<часть>"`, `placement: "replace"` ставит ваш рендер вместо содержимого узла (а не
рядом с ним).

## 8. Сборка `action-list` — рабочий список внутри раздела

Вторая готовая сборка показывает, что внутрь раздела ложится не только текст: там настоящий
`listbox` со своим поведением, данные ему дают вложенные `children` той же строки.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function ActionListAccordionDemo() {
  const data = {
    items: [
      {
        value: "s1",
        label: "Раздел 1",
        activeValues: ["i2"],
        children: [
          { value: "i1", label: "Пункт 1" },
          { value: "i2", label: "Пункт 2" },
        ],
      },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("accordion", { "data-variant": "xxx" }, "action-list", data)}
      registry={registry}
      data={data}
      dispatch={(event) => console.log(event.name, event.context)}
    />
  );
}
```

Полезно проверить: выбранный пункт помечен `[data-state="checked"]` по `activeValues`, клик по
пункту отдаёт `select` с его собственной строкой данных, клик по кнопке раздела — `triggerClick` со
строкой раздела. Индикатор выбора — настоящая `Icon`, она приезжает асинхронно: в тесте её ждут
отдельно (`vi.waitFor`), в браузере она просто появляется чуть позже остального дерева.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля — раскрытие видно атрибутами, но плавная анимация по
высоте приезжает формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён
вместе со скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка. Полный рабочий прогон сборок и слота — `test/accordion.test.tsx`.
