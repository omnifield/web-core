# 🧪 Примеры — как работать с `Listbox`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; `comfortable`/`compact` ниже это имена из проверочного
> рецепта, в своей форме они могут быть другими (те же имена показывает витрина в карточке
> компонента). Атрибут ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно
> этот кусок CSS.

## 1. Ручная сборка — список, видимый целиком

Самый простой путь: JSX-композиция, без схемы и движка. В отличие от селекта, ничего не
раскрывается: `content` всегда в документе и всегда интерактивен — поэтому у листа нет и не должно
быть состояний `open`/`closed`.

```tsx
import { For } from "@web-core/solid";
import {
  Listbox,
  ListboxContent,
  ListboxItem,
  ListboxItemIndicator,
  ListboxItemText,
  ListboxLabel,
  ListboxValueText,
} from "@web-core/ui";

const countries = [
  { value: "ru", label: "Россия" },
  { value: "us", label: "США" },
  { value: "de", label: "Германия" },
];

export function BasicListboxDemo() {
  return (
    <Listbox data-variant="xxx" items={countries}>
      <ListboxLabel>Страна</ListboxLabel>
      <ListboxContent>
        <For each={countries}>
          {(item) => (
            <ListboxItem item={item}>
              <ListboxItemText>{item.label}</ListboxItemText>
              <ListboxItemIndicator>✓</ListboxItemIndicator>
            </ListboxItem>
          )}
        </For>
      </ListboxContent>
      <ListboxValueText placeholder="Ничего не выбрано" />
    </Listbox>
  );
}
```

Полезно проверить: выбранный пункт помечен `[data-state="checked"]` (и сам `item`, и его
`itemText`), а тот, на который просто перешли стрелкой или указателем, — `[data-highlighted]`: это
разные вещи, и красить их надо по-разному. Корень берёт ПЛОСКИЙ массив `items`, коллекцию он строит
внутри сам.

## 2. Множественный и «файловый» выбор

`selectionMode="multiple"` — клик переключает пункт без модификатора. `"extended"` — выбор с
`Cmd`/`Ctrl` и диапазоном с `Shift`, как в файловом менеджере.

```tsx
import { For } from "@web-core/solid";
import { Listbox, ListboxContent, ListboxItem, ListboxItemText, ListboxLabel } from "@web-core/ui";

const files = [
  { value: "a", label: "отчёт.pdf" },
  { value: "b", label: "смета.xlsx" },
  { value: "c", label: "договор.docx" },
];

export function MultipleListboxDemo() {
  return (
    <Listbox data-variant="xxx" items={files} selectionMode="extended">
      <ListboxLabel>Файлы</ListboxLabel>
      <ListboxContent>
        <For each={files}>
          {(item) => (
            <ListboxItem item={item}>
              <ListboxItemText>{item.label}</ListboxItemText>
            </ListboxItem>
          )}
        </For>
      </ListboxContent>
    </Listbox>
  );
}
```

Полезно проверить: в `extended` обычный клик снимает прежний выбор, а `Cmd`/`Ctrl`+клик добавляет —
в `multiple` добавляет любой клик. Обратите внимание: `selectionMode` — настоящий проп, но в
паспорте его НЕТ (закрытый словарь настроек кита не знает трёхзначного выбора), поэтому одеть его
отдельной веткой рецепта нельзя, см. [`README.md`](./README.md).

## 3. Фильтрация и пустой набор

`input` — настоящая часть анатомии под поиск. Сам лист ничего не фильтрует: какой набор пунктов
показывать, решает потребитель и отдаёт готовым списком в `items`; корень пересобирает коллекцию
под новый набор сам.

```tsx
import { createMemo, createSignal, For } from "@web-core/solid";
import {
  Listbox,
  ListboxContent,
  ListboxEmpty,
  ListboxInput,
  ListboxItem,
  ListboxItemText,
  ListboxLabel,
} from "@web-core/ui";

const frameworks = [
  { value: "solid", label: "Solid" },
  { value: "svelte", label: "Svelte" },
  { value: "vue", label: "Vue" },
];

export function FilteredListboxDemo() {
  const [query, setQuery] = createSignal("");
  const shown = createMemo(() =>
    frameworks.filter((item) => item.label.toLowerCase().includes(query().toLowerCase())),
  );

  return (
    <Listbox data-variant="xxx" items={shown()}>
      <ListboxLabel>Фреймворк</ListboxLabel>
      <ListboxInput placeholder="Поиск…" onInput={(event) => setQuery(event.currentTarget.value)} />
      <ListboxContent>
        <For each={shown()}>
          {(item) => (
            <ListboxItem item={item}>
              <ListboxItemText>{item.label}</ListboxItemText>
            </ListboxItem>
          )}
        </For>
        <ListboxEmpty>Ничего не найдено</ListboxEmpty>
      </ListboxContent>
    </Listbox>
  );
}
```

Полезно проверить: наберите заведомо несуществующее — `content` получает `[data-empty]`, и в
разметке появляется узел `empty`; сотрите ввод — узел исчезает целиком. Своего состояния `empty` не
несёт: сам факт его присутствия и есть состояние.

## 4. Плотность — это вид, а не настройка

У листа вариации не про значимость (как `primary`/`danger` у кнопки), а про плотность: сколько
строк влезает до прокрутки. Поэтому они и живут осью вида.

```tsx
import { For } from "@web-core/solid";
import { Listbox, ListboxContent, ListboxItem, ListboxItemText } from "@web-core/ui";

const items = [
  { value: "1", label: "Первый" },
  { value: "2", label: "Второй" },
];

export function DensityListboxDemo() {
  return (
    <div style={{ display: "flex", gap: "16px" }}>
      <For each={["comfortable", "compact"]}>
        {(variant) => (
          <Listbox data-variant={variant} items={items}>
            <ListboxContent>
              <For each={items}>
                {(item) => (
                  <ListboxItem item={item}>
                    <ListboxItemText>{item.label}</ListboxItemText>
                  </ListboxItem>
                )}
              </For>
            </ListboxContent>
          </Listbox>
        )}
      </For>
    </div>
  );
}
```

Полезно проверить: разница видна только с надетой формой скина, в которой эти имена объявлены — сам
кит отступов не несёт. Имена берите из своей формы: `comfortable`/`compact` это имена проверочного
рецепта кита, а не обязательный словарь.

## 5. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Подпись и пункты приезжают из
данных (`/label`, `/items` по io-схеме), галочка выбранного — настоящая `Icon` из общего реестра.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineListboxDemo() {
  const data = {
    label: "Страна",
    items: [
      { value: "ru", label: "Россия" },
      { value: "us", label: "США" },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("listbox", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: пунктов ровно столько, сколько принесли данные — `repeat` в сборке называет
раскладку, а не количество. Если `/items` ещё не приехали, список просто пуст: корень подставляет
пустой массив вместо падения ([`FAQ.md`](./FAQ.md)).

## 6. Лист внутри чужой сборки

У листа нет `selfAssembly`: голая ссылка `{ node: "listbox" }` даст только корень. Составное
поддерево авторится рядом, а части адресуются через точку — `listbox.content`, `listbox.item`,
`listbox.itemText`. Готовый живой пример — сборка `action-list` у аккордеона:

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function ListboxInsideAccordionDemo() {
  const data = {
    items: [
      {
        value: "s1",
        label: "Раздел",
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

Полезно проверить: клик по пункту отдаёт `select` со всей строкой данных пункта. Голое имя части
(`content` вместо `listbox.content`) в адресе ЧУЖОЙ сборки не ошибка — оно просто резолвится в
никуда и молча ничего не рисует, поэтому промах заметен только по пустому месту.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: рамка, плотность строк, подсветка и отметка выбранного
приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со
скином.

Одна деталь из практики: выбранный пункт метится ЦВЕТОМ ТЕКСТА, а не заливкой всей строки — сплошная
заливка в живой композиции читается как нестилизованная плашка. Полный рабочий прогон —
`test/listbox.test.tsx`.
