# 🧪 Примеры — как работать с `Select`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — одиночный выбор

Самый простой путь: JSX-композиция, без схемы и движка. Корень берёт ПЛОСКИЙ массив `items`, а не
готовую коллекцию — коллекцию он строит и мемоизирует сам внутри.

```tsx
import { For } from "@web-core/solid";
import {
  Select,
  SelectContent,
  SelectControl,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";

const countries = [
  { value: "ru", label: "Россия" },
  { value: "us", label: "США" },
  { value: "de", label: "Германия" },
];

export function BasicSelectDemo() {
  return (
    <Select data-variant="xxx" items={countries}>
      <SelectLabel>Страна</SelectLabel>
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder="Выберите страну" />
        </SelectTrigger>
        <SelectIndicator>▾</SelectIndicator>
      </SelectControl>
      <SelectPositioner>
        <SelectContent>
          <For each={countries}>
            {(item) => (
              <SelectItem item={item}>
                <SelectItemText>{item.label}</SelectItemText>
                <SelectItemIndicator>✓</SelectItemIndicator>
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </SelectPositioner>
    </Select>
  );
}
```

Полезно проверить: клик по триггеру открывает список (`[data-state="open"]` на `control`/`trigger`/
`indicator`/`content`), клик по пункту выбирает его и закрывает список, а `valueText` показывает
подпись выбранного вместо плейсхолдера (у триггера при этом пропадает `[data-placeholder-shown]`).
Список живёт в портале в конце документа, а не на месте `<Select>` — так задумано, см.
[`FAQ.md`](./FAQ.md).

## 2. Множественный выбор и сброс

`multiple` — клик добавляет пункт к выбору, а не заменяет его, и список остаётся открытым;
`SelectClearTrigger` сбрасывает выбор целиком.

```tsx
import { For } from "@web-core/solid";
import {
  Select,
  SelectClearTrigger,
  SelectContent,
  SelectControl,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";

const days = [
  { value: "mon", label: "Понедельник" },
  { value: "tue", label: "Вторник" },
  { value: "wed", label: "Среда" },
];

export function MultipleSelectDemo() {
  return (
    <Select data-variant="xxx" items={days} multiple>
      <SelectLabel>Дни недели</SelectLabel>
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder="Ничего не выбрано" />
        </SelectTrigger>
        <SelectClearTrigger>✕</SelectClearTrigger>
      </SelectControl>
      <SelectPositioner>
        <SelectContent>
          <For each={days}>
            {(item) => (
              <SelectItem item={item}>
                <SelectItemText>{item.label}</SelectItemText>
                <SelectItemIndicator>✓</SelectItemIndicator>
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </SelectPositioner>
    </Select>
  );
}
```

Полезно проверить: после двух кликов оба пункта держат `[data-state="checked"]`, список не
закрылся, а `valueText` перечисляет выбранное через запятую. `multiple` — единственная настройка
селекта, и она объявлена в паспорте: скин может одеть её отдельно от базового вида.

## 3. Группы пунктов

Связанные пункты под общей подписью — та же анатомия, просто между `content` и `item` появляется
`itemGroup`.

```tsx
import {
  Select,
  SelectContent,
  SelectControl,
  SelectItem,
  SelectItemGroup,
  SelectItemGroupLabel,
  SelectItemIndicator,
  SelectItemText,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";

const items = [
  { value: "us", label: "США" },
  { value: "de", label: "Германия" },
];

export function GroupedSelectDemo() {
  return (
    <Select data-variant="xxx" items={items}>
      <SelectControl>
        <SelectTrigger>
          <SelectValueText placeholder="Выберите страну" />
        </SelectTrigger>
      </SelectControl>
      <SelectPositioner>
        <SelectContent>
          <SelectItemGroup>
            <SelectItemGroupLabel>Северная Америка</SelectItemGroupLabel>
            <SelectItem item={items[0]!}>
              <SelectItemText>США</SelectItemText>
              <SelectItemIndicator>✓</SelectItemIndicator>
            </SelectItem>
          </SelectItemGroup>

          <SelectItemGroup>
            <SelectItemGroupLabel>Европа</SelectItemGroupLabel>
            <SelectItem item={items[1]!}>
              <SelectItemText>Германия</SelectItemText>
              <SelectItemIndicator>✓</SelectItemIndicator>
            </SelectItem>
          </SelectItemGroup>
        </SelectContent>
      </SelectPositioner>
    </Select>
  );
}
```

Полезно проверить: подпись группы (`itemGroupLabel`) своих состояний не несёт вовсе — это чистая
надпись, не выбираемый пункт. Навигация с клавиатуры идёт по пунктам, подписи групп она
перескакивает.

## 4. Управляемое значение и участие в форме

Значение держит внешний сигнал. Полем формы селект становится не сам по себе: за это отвечает
`SelectHiddenSelect` — настоящий нативный `<select>`, который потребитель кладёт РЯДОМ внутри
корня (в отличие от чекбокса, где скрытый ввод кладёт сам корень). Своей части в анатомии у него
нет — красить там нечего, он невидим.

```tsx
import { createSignal, For } from "@web-core/solid";
import {
  Select,
  SelectContent,
  SelectControl,
  SelectHiddenSelect,
  SelectItem,
  SelectItemText,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";

const roles = [
  { value: "admin", label: "Администратор" },
  { value: "user", label: "Пользователь" },
];

export function ControlledSelectDemo() {
  const [value, setValue] = createSignal<string[]>(["user"]);

  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <Select
        data-variant="xxx"
        items={roles}
        name="role"
        value={value()}
        onValueChange={(details) => setValue(details.value)}
      >
        <SelectHiddenSelect />
        <SelectControl>
          <SelectTrigger>
            <SelectValueText placeholder="Выберите роль" />
          </SelectTrigger>
        </SelectControl>
        <SelectPositioner>
          <SelectContent>
            <For each={roles}>
              {(item) => (
                <SelectItem item={item}>
                  <SelectItemText>{item.label}</SelectItemText>
                </SelectItem>
              )}
            </For>
          </SelectContent>
        </SelectPositioner>
      </Select>

      <p>выбрано: {value().join(", ")}</p>
    </form>
  );
}
```

Полезно проверить: `onValueChange` отдаёт `details.value` СПИСКОМ ключей всегда — и в одиночном
режиме тоже (там это список из одного). Ключи кит не толкует: что они значат, решает потребитель.
Уберите `SelectHiddenSelect` — визуально ничего не изменится, но `FormData` перестанет видеть поле:
это единственное, за что он отвечает.

## 5. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Подпись, плейсхолдер и пункты
приезжают из данных (`/label`, `/placeholder`, `/items` по io-схеме); `repeat` на пункте называет
раскладку, а не количество — сколько пунктов принесут данные, столько и нарисуется.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineSelectDemo() {
  const data = {
    label: "Страна",
    placeholder: "Выберите страну",
    items: [
      { value: "ru", label: "Россия" },
      { value: "us", label: "США" },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("select", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
      dispatch={(event) => console.log(event.name, event.context)}
    />
  );
}
```

Полезно проверить: клик по пункту отдаёт событие `select`, и в `context.payload` лежит ВЕСЬ пункт
целиком (`{ value, label }`), а не только ключ. Пустые данные (`/items` ещё не приехали) — законное
состояние: список просто пуст, ничего не падает.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: рамка контрола, фон списка, подсветка пункта и приглушённый
плейсхолдер приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён
вместе со скином.

Одна деталь видна только живьём: у длинного списка высоту ограничивает `positioner`, а прокручивает
себя сам `content` — если в своей форме сделать иначе, прокрутка появится у всей страницы, а не у
списка (разбор — [`FAQ.md`](../../FAQ.md) зоны). Полный рабочий прогон — `test/select.test.tsx`.
