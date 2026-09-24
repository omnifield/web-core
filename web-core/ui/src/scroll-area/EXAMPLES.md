# 🧪 Примеры — как работать с `ScrollArea`

Рабочий код для локального теста, не канон. Анатомия, состояния и рецепт — [`README.md`](./README.md).
Здесь — то, что можно скопировать и сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

> [!NOTE]
> У компонента нет своих `FAQ.md`/`ROADMAP.yaml` — разборы и план по нему живут в доке зоны
> (`web-core/ui/FAQ.md`, `web-core/ui/ROADMAP.yaml`).

## 1. Ручная сборка — две оси

Самый простой путь: JSX-композиция, без схемы и движка. `scrollbar`/`thumb` — по одной паре на
каждую нужную ось, `corner` заполняет квадрат, где полосы встречаются.

```tsx
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@web-core/ui";

export function BasicScrollAreaDemo() {
  return (
    <ScrollArea data-variant="xxx">
      <ScrollAreaViewport>
        <ScrollAreaContent>
          <div style={{ width: "1200px" }}>Очень широкое и очень длинное содержимое…</div>
        </ScrollAreaContent>
      </ScrollAreaViewport>

      <ScrollAreaScrollbar orientation="vertical">
        <ScrollAreaThumb orientation="vertical" />
      </ScrollAreaScrollbar>

      <ScrollAreaScrollbar orientation="horizontal">
        <ScrollAreaThumb orientation="horizontal" />
      </ScrollAreaScrollbar>

      <ScrollAreaCorner />
    </ScrollArea>
  );
}
```

Полезно проверить: прокрутка настоящая — её ведёт нативный `overflow: auto` на `viewport`, а не
JS. На корне, окне, содержимом, полосе и углу появляются `[data-overflow-x]`/`[data-overflow-y]`,
когда содержимое реально не влезает: по ним форма и решает, показывать ли полосу.

## 2. Одна ось — угол не нужен

`corner` существует ровно затем, чтобы заполнить место пересечения ДВУХ полос. Одноосевая
прокрутка его не кладёт вовсе.

```tsx
import {
  ScrollArea,
  ScrollAreaContent,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "@web-core/ui";

export function SingleAxisScrollAreaDemo() {
  return (
    <ScrollArea data-variant="xxx">
      <ScrollAreaViewport>
        <ScrollAreaContent>Длинный текст, который не влезает по высоте…</ScrollAreaContent>
      </ScrollAreaViewport>

      <ScrollAreaScrollbar orientation="vertical">
        <ScrollAreaThumb orientation="vertical" />
      </ScrollAreaScrollbar>
    </ScrollArea>
  );
}
```

Полезно проверить: если угол всё же положили, а прокрутка идёт по одной оси, он получает
`[data-state="hidden"]` — но САМ не прячется: это метка, а не нативное скрытие. Спрятать его должна
форма скина, кит непрошено ничего не убирает.

## 3. Края прокрутки — «докрутили до конца»

`viewport` сам сообщает, что дошли до края: `at-top`/`at-bottom`/`at-left`/`at-right`. Обычный
живой сценарий — тень у верхнего края, пока не докрутили до начала.

```tsx
import { For } from "@web-core/solid";
import { ScrollArea, ScrollAreaContent, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from "@web-core/ui";

export function EdgesScrollAreaDemo() {
  return (
    <ScrollArea data-variant="xxx">
      <ScrollAreaViewport>
        <ScrollAreaContent>
          <For each={Array.from({ length: 60 }, (_, index) => index)}>
            {(index) => <p>Строка {index + 1}</p>}
          </For>
        </ScrollAreaContent>
      </ScrollAreaViewport>

      <ScrollAreaScrollbar orientation="vertical">
        <ScrollAreaThumb orientation="vertical" />
      </ScrollAreaScrollbar>
    </ScrollArea>
  );
}
```

Полезно проверить: `[data-at-top]` стоит, пока не прокрутили, и снимается при первом же движении;
`[data-at-bottom]` появляется, когда докрутили донизу. Это единственные состояния, которые несёт
именно окно, а не корень.

## 4. Наведение и перетаскивание — общий факт, не «именно этот узел»

`hover`/`dragging` у полосы, бегунка и угла — ОДНО служебное значение на всех трёх: «указатель
где-то рядом с элементами прокрутки прямо сейчас». Это не замена настоящему `:hover`.

Полезно проверить: правило формы, завязанное на `hover` у `scrollbar`, сработает и пока указатель
стоит над `thumb`. Так считает сам компонент — если нужно «именно этот узел», берите настоящий
CSS-псевдокласс, а не метку.

## 5. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Из данных приезжает только
текст содержимого (`/content` по io-схеме); сколько осей показывать — решает автор сборки, это
структура, а не данные.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineScrollAreaDemo() {
  const data = {
    content: "Очень длинный текст, который обязан реально переполнить фиксированную высоту…",
  };

  return (
    <RenderTree
      tree={instanceOf("scroll-area", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: чтобы область вообще что-то доказывала, текст должен быть длиннее её высоты —
на пустом боксе прокручивать нечего, и все состояния останутся пустыми. Событий наружу схемы
область не отдаёт: `dispatch` ей не нужен.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: сетка из окна, полос и угла, а также высота самой
области приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён
вместе со скином.

Деталь для авторов форм: своей набивки `content` не носит — это место потребителя, и отступы
задаёт то, что в него положили. Раскладка держится на `root` (`display: grid`): окно слева сверху,
вертикальная полоса справа, горизонтальная снизу, угол в правом нижнем.
