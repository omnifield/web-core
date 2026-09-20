# 🧪 Примеры — как работать с `Typography`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

## 1. Ручная сборка — текст трёх видов

Самый простой путь: JSX-композиция, без схемы и движка. Вид даёт `data-variant`, имена вариаций —
те, что человек завёл в форме скина (`body`/`heading`/`caption` в проверочном рецепте).

```tsx
import { Typography } from "@web-core/ui";

export function BasicTypographyDemo() {
  return (
    <div>
      <Typography>Обычный текст — рисуется как &lt;p&gt;</Typography>
      <Typography data-variant="heading">Заголовок раздела</Typography>
      <Typography data-variant="caption">Мелкая подпись под ним</Typography>
    </div>
  );
}
```

Полезно проверить: на каждом узле стоит `[data-scope="typography"][data-part="root"]`, а
`data-variant` долетает до DOM как есть — по нему скин и находит правило вида.

## 2. Тег и вид — два независимых выбора

`as` отвечает за семантику (что это для браузера и скринридера), `data-variant` — за внешний вид.
Связывать их необязательно: `<h2>`, выглядящий как подпись, — обычная, не экзотическая потребность.

```tsx
import { Typography } from "@web-core/ui";

export function TagVsLookDemo() {
  return (
    <article>
      <Typography as="h1" data-variant="heading">
        Настоящий H1 и выглядит как заголовок
      </Typography>

      <Typography as="h2" data-variant="caption">
        Настоящий H2, но выглядит скромно — структура документа не пострадала
      </Typography>

      <Typography as="span" data-variant="heading">
        Строчный span с видом заголовка
      </Typography>
    </article>
  );
}
```

Полезно проверить: в DOM реально `H1`/`H2`/`SPAN` (не `P` с классами), адрес `data-scope` при этом
на месте у всех трёх. Предел приёма — `as` с ДРУГИМ компонентом кита вместо голого тега, см.
[`FAQ.md`](./FAQ.md).

## 3. Обрезка по ширине — флаг `truncated`

Текст не влезает в свою колонку: вместо переноса — одна строка с многоточием. Флаг складывается с
любой вариацией, отдельного «обрезанного» вида заводить не нужно.

```tsx
import { Typography } from "@web-core/ui";

export function TruncatedDemo() {
  return (
    <div style={{ width: "16rem", border: "1px dashed #999" }}>
      <Typography truncated data-variant="heading">
        Очень длинный заголовок карточки, который заведомо не помещается в свою колонку
      </Typography>

      <Typography data-variant="heading">
        Такой же длинный заголовок без флага — переносится на несколько строк
      </Typography>
    </div>
  );
}
```

Полезно проверить: на первом узле стоит `[data-truncated="true"]` (сам проп `truncated` в разметку
не утекает), текст обрезан по границе рамки и заканчивается многоточием; на втором — перенос,
атрибута нет вовсе. Многоточие рисует браузер, не кит: правило приезжает формой скина
(`text-overflow: ellipsis`), без надетой формы обрезки не будет — будет обычный перенос.

## 4. Обрезка внутри ряда — почему ничего не надо добавлять руками

Самый частый живой случай: текст и кнопка в одной flex-строке. По умолчанию flex-элемент не даёт
себя сжать ниже содержимого, и обрезка молча не срабатывает — за это отвечает `min-width: 0`, уже
вшитый в само правило обрезки, так что снаружи его ставить не нужно.

```tsx
import { Typography } from "@web-core/ui";

export function TruncatedInRowDemo() {
  return (
    <div style={{ display: "flex", "align-items": "center", gap: "8px", width: "20rem" }}>
      <Typography truncated>Очень длинное имя файла, которое надо ужать до одной строки</Typography>
      <button type="button">Открыть</button>
    </div>
  );
}
```

Полезно проверить: кнопка остаётся целиком видимой и не уезжает за край, ужимается именно текст.
Ширину задаёт РОДИТЕЛЬ — сам `root` своих размеров не носит, поэтому в контейнере без ограничения
по ширине обрезать будет нечего.

## 5. Рендер через движок

Та же композиция, но собранная по схеме (сборка `basic`) и нарисованная `RenderTree`, а не руками.
Текст приезжает из данных (`/text` по io-схеме компонента), в сборке он не зашит.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineTypographyDemo() {
  const data = { text: "Живой текст из данных" };
  const tree = instanceOf("typography", {}, "basic", data);

  return <RenderTree tree={tree} registry={registry} data={data} />;
}
```

`registry` и `instanceOf` приезжают парой из `kitComponentRenderer()` — реестр уже собран поверх
всего кита, руками под один компонент его строить не нужно. Полный рабочий пример со своим,
собранным вручную реестром — `test/typography.test.tsx`.

Полезно проверить: в DOM один узел `P` с адресом и текстом из `data`, а не из схемы — поменяйте
`data.text`, и содержимое поменяется без правки дерева.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля, поэтому и вариации, и обрезка видны только с надетой
формой скина. Витрина, где это уже собрано:

```bash
pnpm --filter @web-core/studio dev   # → http://localhost:5174
```

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка: настоящий вид живёт записью формы в службе скина.
