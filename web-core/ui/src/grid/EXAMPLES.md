# 🧪 Примеры — как работать с `Grid`

Рабочий код для локального теста, не канон. Анатомия и рецепт — [`README.md`](./README.md). Здесь —
то, что можно скопировать и сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — у сетки это ВСЯ раскладка целиком.** Ни числа колонок,
> ни зазора, ни выравнивания в разметке нет: голая сетка ничего не расставляет, и это её законное
> состояние. Имя вида придумывает не кит, а форма скина — запись в службе; `gallery`/`sidebar`/
> `stack` ниже это имена проверочного рецепта, в своей форме они могут быть другими (те же имена
> показывает витрина в карточке компонента).

> [!NOTE]
> У компонента нет своих `FAQ.md`/`ROADMAP.yaml` — разборы и план по нему живут в доке зоны
> (`web-core/ui/FAQ.md`, `web-core/ui/ROADMAP.yaml`).

## 1. Ручная сборка — галерея карточек

Самый простой путь: JSX-композиция, без схемы и движка. Дети кладутся в сетку напрямую; `cell`
нужен только там, где у элемента своё место.

```tsx
import { For } from "@web-core/solid";
import { Grid, Surface } from "@web-core/ui";

export function BasicGridDemo() {
  const cards = ["Первая", "Вторая", "Третья", "Четвёртая"];

  return (
    <Grid data-variant="gallery">
      <For each={cards}>{(title) => <Surface data-variant="xxx">{title}</Surface>}</For>
    </Grid>
  );
}
```

Полезно проверить: без надетой формы карточки встанут в столбик — дорожки задаёт правило скина по
адресу `[data-scope="grid"]`. Проп `columns` кит не несёт намеренно: он означал бы, что кит знает,
как выглядит раскладка.

## 2. Зачем сетка, если есть поток

Поток переносит элементы, но каждая строка живёт сама по себе — колонки формы, собранной потоками,
разъезжаются, как только подпись в одной строке длиннее соседней. Сетка держит дорожки ОБЩИМИ, и
это её единственный предмет.

```tsx
import { Field, FieldInput, FieldLabel, Grid } from "@web-core/ui";

export function FormGridDemo() {
  return (
    <Grid data-variant="xxx">
      <Field data-variant="xxx">
        <FieldLabel>Имя</FieldLabel>
        <FieldInput />
      </Field>

      <Field data-variant="xxx">
        <FieldLabel>Отчество (если есть)</FieldLabel>
        <FieldInput />
      </Field>
    </Grid>
  );
}
```

Полезно проверить: подписи разной длины не сдвигают поля друг относительно друга — обе колонки
идут по общим дорожкам. В потоке то же самое расползётся.

## 3. Ячейка — адрес для «этот занимает больше места»

`cell` заводится ради элемента, у которого своё место в сетке. Свойства размещения живут на
ребёнке, а дети сетки — чужие компоненты: правило, адресующее их напрямую, попало бы во все разом.

```tsx
import { Field, FieldInput, FieldLabel, Grid, GridCell } from "@web-core/ui";

export function CellGridDemo() {
  return (
    <Grid data-variant="xxx">
      <Field data-variant="xxx">
        <FieldLabel>Город</FieldLabel>
        <FieldInput />
      </Field>

      <Field data-variant="xxx">
        <FieldLabel>Индекс</FieldLabel>
        <FieldInput />
      </Field>

      <GridCell>
        <Field data-variant="xxx">
          <FieldLabel>Адрес — во всю ширину</FieldLabel>
          <FieldInput />
        </Field>
      </GridCell>
    </Grid>
  );
}
```

Полезно проверить: правило формы пишется на `grid.cell` и попадает только на обёрнутый элемент. И
важное: `data-variant` НА САМОЙ ячейке ни одно правило не заденет — имя вида физически живёт только
на корне, а селектор вида для некорневой части читает атрибут ПРЕДКА. Сколько места нужно одному
экземпляру среди одинаковых соседей — решение того, кто собирает структуру, не автора формы.

## 4. Каркас из двух вложенных сеток

`sidebar` и `stack` вместе дают асимметричную двухпанельную раскладку без третьего компонента:
узкая колонка плюс остальное, а внутри — шапка по содержимому плюс показ.

```tsx
import { Grid, Surface } from "@web-core/ui";

export function ShellGridDemo() {
  return (
    <Grid data-variant="sidebar">
      <Surface data-variant="xxx">Рельсы</Surface>

      <Grid data-variant="stack">
        <Surface data-variant="xxx">Шапка</Surface>
        <Surface data-variant="xxx">Показ</Surface>
      </Grid>
    </Grid>
  );
}
```

Полезно проверить: три случая (`gallery`/`sidebar`/`stack`) — это три РАЗНЫХ значения дорожек, а не
одна раскладка с настройкой. Поэтому они и живут отдельными именами вида.

## 5. Другой тег

`as` меняет корневой элемент — и у сетки, и у ячейки по отдельности.

```tsx
import { Grid, GridCell } from "@web-core/ui";

export function SemanticGridDemo() {
  return (
    <Grid as="ul" data-variant="gallery">
      <GridCell as="li">Первый</GridCell>
      <GridCell as="li">Второй</GridCell>
    </Grid>
  );
}
```

Полезно проверить: в DOM настоящие `UL`/`LI`, адрес сетки на месте. Предел тот же, что у кнопки и
поверхности: `as` на другой компонент кита — не рабочий путь.

## 6. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Своего io у сетки нет —
данных ей не нужно, в сборке лежат четыре ячейки с текстом.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineGridDemo() {
  return (
    <RenderTree
      tree={instanceOf("grid", { "data-variant": "gallery" }, "basic", {})}
      registry={registry}
      data={{}}
    />
  );
}
```

Полезно проверить: ячеек в сборке четыре не случайно — на одной не видно ни колонок, ни строк, а
сетка ровно про них. Состояний у сетки нет ни одного.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: дорожки, зазор и выравнивание приезжают формой скина.
Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со скином.

Честный предел: число колонок, вычисленное ИЗ ДАННЫХ (столько дорожек, сколько полей приехало), так
не выражается — это предмет компонента, который эти данные знает, а не общей сетки.
