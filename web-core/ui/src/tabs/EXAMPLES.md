# 🧪 Примеры — как работать с `Tabs`

Рабочий код для локального теста, не канон. Анатомия, состояния и рецепт — [`README.md`](./README.md).
Здесь — то, что можно скопировать и сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; `line`/`enclosed`/`pills` ниже это имена из
> проверочного рецепта, в своей форме они могут быть другими (те же имена показывает витрина в
> карточке компонента). Атрибут ставится на КОРЕНЬ компонента, и по нему же компонент просит у
> скина ровно этот кусок CSS.

> [!NOTE]
> У компонента нет своих `FAQ.md`/`ROADMAP.yaml` — обоснования и план по нему живут в доке зоны
> (`web-core/ui/FAQ.md`, `web-core/ui/ROADMAP.yaml`).

## 1. Ручная сборка — ряд табов с панелями

Самый простой путь: JSX-композиция, без схемы и движка. Указатель кладётся ОДИН на весь список,
рядом с триггерами, а не внутрь каждого.

```tsx
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@web-core/ui";

export function BasicTabsDemo() {
  return (
    <Tabs data-variant="xxx" defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Аккаунт</TabsTrigger>
        <TabsTrigger value="billing">Оплата</TabsTrigger>
        <TabsIndicator />
      </TabsList>

      <TabsContent value="account">Имя, почта, пароль.</TabsContent>
      <TabsContent value="billing">Карта и история платежей.</TabsContent>
    </Tabs>
  );
}
```

Полезно проверить: выбранный триггер и его панель помечены `[data-selected]`, указатель едет к
активному табу (кит меряет его и пишет `--left`/`--top`/`--width`/`--height`). Триггер — настоящая
`<button>` со своим DOM-фокусом, поэтому `:hover`/`:focus-visible`/`:active` здесь работают как
обычные псевдоклассы, не подменяются атрибутами.

## 2. Три способа подать табы — это вид, а не настройка

`line` — полоса под активным табом, `enclosed` — рамка вместо полосы (указатель скрыт, выбор несёт
сама рамка), `pills` — заливка, где указатель становится подложкой под текстом.

```tsx
import { For } from "@web-core/solid";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@web-core/ui";

export function VariantsTabsDemo() {
  return (
    <For each={["line", "enclosed", "pills"]}>
      {(variant) => (
        <Tabs data-variant={variant} defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">Первый</TabsTrigger>
            <TabsTrigger value="two">Второй</TabsTrigger>
            <TabsIndicator />
          </TabsList>

          <TabsContent value="one">Панель первого</TabsContent>
          <TabsContent value="two">Панель второго</TabsContent>
        </Tabs>
      )}
    </For>
  );
}
```

Полезно проверить: разница видна только с надетой формой скина, в которой эти имена объявлены. И
`indicator` в разметке остаётся всегда — в `enclosed` он просто спрятан формой, а не выброшен из
композиции.

## 3. Управляемое переключение и вертикальные табы

Значение держит внешний сигнал; `orientation` — настоящая настройка паспорта: меняет не только
раскладку, но и то, какими стрелками ходит клавиатура.

```tsx
import { createSignal } from "@web-core/solid";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@web-core/ui";

export function ControlledTabsDemo() {
  const [tab, setTab] = createSignal("account");

  return (
    <>
      <button type="button" onClick={() => setTab("billing")}>
        Перейти к оплате снаружи
      </button>

      <Tabs
        data-variant="xxx"
        orientation="vertical"
        value={tab()}
        onValueChange={(details) => setTab(details.value)}
      >
        <TabsList>
          <TabsTrigger value="account">Аккаунт</TabsTrigger>
          <TabsTrigger value="billing">Оплата</TabsTrigger>
          <TabsIndicator />
        </TabsList>

        <TabsContent value="account">Имя, почта, пароль.</TabsContent>
        <TabsContent value="billing">Карта и история платежей.</TabsContent>
      </Tabs>
    </>
  );
}
```

Полезно проверить: на корне `data-orientation="vertical"`, фокус между табами двигают ↑/↓, а
`Tab` заходит на активный таб и следующим нажатием — на его панель. Указатель при этом одинаково
верно работает в обеих ориентациях: его геометрия живёт в базе и настройке, а не в имени вида.

## 4. Отключённый таб и ручная активация

`disabled` на одном триггере не трогает остальные. `activationMode="manual"` разводит фокус и
выбор: стрелки только переводят фокус, а активирует таб `Enter`/`Space`.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@web-core/ui";

export function ManualTabsDemo() {
  return (
    <Tabs data-variant="xxx" activationMode="manual" defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Аккаунт</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Оплата — временно закрыта
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account">Имя, почта, пароль.</TabsContent>
      <TabsContent value="billing">Карта и история платежей.</TabsContent>
    </Tabs>
  );
}
```

Полезно проверить: `[data-disabled]` только на отключённом триггере, кликом и стрелками он не
выбирается. В ручном режиме панель не меняется, пока не нажмёте `Enter`/`Space` — удобно, когда
переключение дорогое (грузит данные).

## 5. Тяжёлая панель — монтировать позже

`lazyMount` строит панель только при первой активации, `unmountOnExit` убирает её обратно при уходе
с таба. Флаги живут на самой панели, а не на корне.

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@web-core/ui";

export function LazyTabsDemo() {
  return (
    <Tabs data-variant="xxx" defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Аккаунт</TabsTrigger>
        <TabsTrigger value="report">Отчёт</TabsTrigger>
      </TabsList>

      <TabsContent value="account">Имя, почта, пароль.</TabsContent>
      <TabsContent value="report" lazyMount unmountOnExit>
        <ExpensiveReport />
      </TabsContent>
    </Tabs>
  );
}
```

Полезно проверить: до первого перехода на «Отчёт» его панели в документе нет вовсе, после ухода она
снова исчезает. Без флагов панели живут в DOM всегда, просто скрытые.

## 6. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Подписи и содержимое панелей
приезжают из данных (`/items` по io-схеме: `value`/`label` канонические, плюс своё поле `content`).

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineTabsDemo() {
  const data = {
    items: [
      { value: "account", label: "Аккаунт", content: "Имя, почта, пароль." },
      { value: "billing", label: "Оплата", content: "Карта и история платежей." },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("tabs", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: без начального значения не выбран ни один таб — задать его можно пропом корня
(`instanceOf("tabs", { "data-variant": "xxx", defaultValue: "account" }, …)`). Наружу схемы табы
событий не отдают: переключение ведёт сама машина, `dispatch` им не нужен.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: полоса, рамка, заливка и движение указателя приезжают
формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со скином.

Деталь для авторов форм: пересечение «эта настройка И этот вид» модель рецепта не выражает — группы
накладываются `base → settings → variants`. Поэтому геометрию указателя для базового вида держат в
базе и настройке ориентации, а не внутри имени вида: иначе вид сломает вертикальную раскладку.
Полный рабочий прогон — `test/tabs.test.tsx`.
