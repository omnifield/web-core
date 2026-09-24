# 🧪 Примеры — как работать с `Splitter`

Рабочий код для локального теста, не канон. Список частей, состояний и настроек —
[`README.md`](./README.md). Здесь — то, что можно скопировать и сразу погонять.

> [!IMPORTANT]
> **Вид ставится атрибутом `data-variant` на корень — это основной вход стилизации.** Кит по
> умолчанию не несёт ни одного стиля: без формы скина панели не будут ни разделены, ни видимо
> перетаскиваемы, и это не поломка. Имя вида придумывает не кит, а форма скина — запись в службе;
> поэтому в примерах ниже стоит `data-variant="xxx"`, подставьте имя своей формы (те же имена
> показывает витрина в карточке компонента).

> [!NOTE]
> У компонента нет ни `FAQ.md`/`ROADMAP.yaml`, ни готовых сборок: `playground/assemblies.ts` пуст,
> человеческие описания частей в `playground/parts.ts` пока заглушки. Поэтому ниже только ручная
> композиция — путь через движок (`instanceOf`) для сплиттера сегодня отдал бы эскиз анатомии, а не
> рабочую раскладку.

## 1. Две панели с ручкой между ними

Минимум, на котором ручка вообще имеет смысл. Корню обязателен `panels` — это ДАННЫЕ об
ограничениях, и машина сопоставляет их с детьми ПО `id`, а не по порядку в разметке.

```tsx
import {
  Splitter,
  SplitterPanel,
  SplitterResizeTrigger,
  SplitterResizeTriggerIndicator,
} from "@web-core/ui";

export function BasicSplitterDemo() {
  return (
    <Splitter data-variant="xxx" panels={[{ id: "list" }, { id: "preview" }]}>
      <SplitterPanel id="list">Список</SplitterPanel>

      <SplitterResizeTrigger id="list:preview">
        <SplitterResizeTriggerIndicator />
      </SplitterResizeTrigger>

      <SplitterPanel id="preview">Просмотр</SplitterPanel>
    </Splitter>
  );
}
```

Полезно проверить: `id` ручки — СОСТАВНОЙ, `"<до>:<после>"` из идентификаторов двух соседних
панелей. Ошиблись в нём — ручка останется в разметке, но тянуть ей будет нечего. Сама ручка —
настоящий `role="separator"`: её можно сфокусировать с клавиатуры и двигать стрелками, без единой
строчки от вас.

## 2. Ограничения размеров и схлопывание

Минимум, максимум и возможность схлопнуть панель живут в `panels`, а не на самих панелях: это
данные о раскладке, и держит их корень.

```tsx
import { Splitter, SplitterPanel, SplitterResizeTrigger, SplitterResizeTriggerIndicator } from "@web-core/ui";

export function ConstrainedSplitterDemo() {
  return (
    <Splitter
      data-variant="xxx"
      defaultSize={[25, 75]}
      panels={[
        { id: "nav", minSize: 15, maxSize: 40, collapsible: true, collapsedSize: 0 },
        { id: "work" },
      ]}
    >
      <SplitterPanel id="nav">Навигация</SplitterPanel>

      <SplitterResizeTrigger id="nav:work">
        <SplitterResizeTriggerIndicator />
      </SplitterResizeTrigger>

      <SplitterPanel id="work">Рабочая область</SplitterPanel>
    </Splitter>
  );
}
```

Полезно проверить: панель не уходит за свои границы даже рывком мыши, а схлопываемая доезжает до
`collapsedSize` и останавливается. `defaultSize` — стартовая раскладка в тех же единицах, что и
ограничения; управляемый вариант — `size` плюс `onResize`.

## 3. Три панели — две ручки

Ручек столько, сколько стыков: каждая называет свою пару соседей.

```tsx
import { Splitter, SplitterPanel, SplitterResizeTrigger, SplitterResizeTriggerIndicator } from "@web-core/ui";

export function ThreePaneSplitterDemo() {
  return (
    <Splitter data-variant="xxx" panels={[{ id: "tree" }, { id: "editor" }, { id: "props" }]}>
      <SplitterPanel id="tree">Дерево</SplitterPanel>

      <SplitterResizeTrigger id="tree:editor">
        <SplitterResizeTriggerIndicator />
      </SplitterResizeTrigger>

      <SplitterPanel id="editor">Редактор</SplitterPanel>

      <SplitterResizeTrigger id="editor:props">
        <SplitterResizeTriggerIndicator />
      </SplitterResizeTrigger>

      <SplitterPanel id="props">Свойства</SplitterPanel>
    </Splitter>
  );
}
```

Полезно проверить: во время перетаскивания `[data-dragging]` появляется сразу на корне, на панелях
и на самой ручке — правило формы можно писать на любую из этих частей.

## 4. Вертикальная раскладка

`orientation` — единственная настройка сплиттера: панели делятся по вертикали, а ручка ездит
вверх-вниз.

```tsx
import { Splitter, SplitterPanel, SplitterResizeTrigger, SplitterResizeTriggerIndicator } from "@web-core/ui";

export function VerticalSplitterDemo() {
  return (
    <Splitter data-variant="xxx" orientation="vertical" panels={[{ id: "code" }, { id: "console" }]}>
      <SplitterPanel id="code">Код</SplitterPanel>

      <SplitterResizeTrigger id="code:console">
        <SplitterResizeTriggerIndicator />
      </SplitterResizeTrigger>

      <SplitterPanel id="console">Консоль</SplitterPanel>
    </Splitter>
  );
}
```

Полезно проверить: на корне появляется `data-orientation="vertical"`, и стрелки клавиатуры меняют
ось — с ↑/↓ вместо ←/→. Раскладку при этом держит форма скина: кит только сообщает ориентацию.

## 5. Заблокированная ручка и слежение за раскладкой

`disabled` на ручке выключает конкретный стык, остальные продолжают работать. `onResize` отдаёт
текущие размеры — ими удобно, например, сохранить раскладку между сессиями.

```tsx
import { Splitter, SplitterPanel, SplitterResizeTrigger, SplitterResizeTriggerIndicator } from "@web-core/ui";

export function LockedSplitterDemo() {
  return (
    <Splitter
      data-variant="xxx"
      panels={[{ id: "a" }, { id: "b" }, { id: "c" }]}
      onResizeEnd={(details) => localStorage.setItem("layout", JSON.stringify(details.size))}
    >
      <SplitterPanel id="a">Фиксированная слева</SplitterPanel>

      <SplitterResizeTrigger id="a:b" disabled>
        <SplitterResizeTriggerIndicator />
      </SplitterResizeTrigger>

      <SplitterPanel id="b">Середина</SplitterPanel>

      <SplitterResizeTrigger id="b:c">
        <SplitterResizeTriggerIndicator />
      </SplitterResizeTrigger>

      <SplitterPanel id="c">Справа</SplitterPanel>
    </Splitter>
  );
}
```

Полезно проверить: у отключённой ручки `[data-disabled]`, она не тянется ни мышью, ни с
клавиатуры; соседняя работает как обычно. `onResizeEnd` срабатывает один раз по отпусканию, а
`onResize` — на каждом кадре перетаскивания: для сохранения берите первый.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: ширина ручки, её подсветка при наведении и перетаскивании,
вид индикатора-хвата приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит
подключён вместе со скином.

Индикатор внутри ручки своего графика не несёт — что показать (насечку, точки, иконку хвата),
решает тот, кто пишет форму или кладёт содержимое внутрь.
