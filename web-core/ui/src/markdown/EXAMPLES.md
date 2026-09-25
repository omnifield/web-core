# 🧪 Примеры — как работать с `Markdown`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md),
разборы — [`FAQ.md`](../../FAQ.md) зоны (своего `FAQ.md` у компонента нет). Здесь — то, что можно
скопировать и сразу погонять.

## 1. Ручная сборка — документ одним пропом

Самый простой путь: текст приходит пропом `text`, части растит сам документ. Вид даёт `data-variant`
— имя вида придумывает форма скина (`xxx` здесь заглушка), и по нему компонент просит у скина CSS.

```tsx
import { Markdown } from "@web-core/ui";

const doc = `# Заголовок

Абзац с \`кодом\` внутри и [ссылкой](/docs).

- первый пункт
- второй пункт
`;

export function BasicMarkdownDemo() {
  return <Markdown data-variant="xxx" text={doc} />;
}
```

Полезно проверить: на корне стоит `[data-scope="markdown"][data-part="root"]`, а внутри — `heading`,
`paragraph`, `code`, `link`, `list`, каждый со своим `data-part`. Между корнем и частями лежит один
неадресованный `<div>` разборщика — так и должно быть (разбор в `FAQ.md` зоны).

## 2. Уровень заголовка и нумерованность списка — это состояния, не вариации

Документ приносит их сам, кит перекладывает в метку: по ней рецепт различает вид, не заводя шесть
вариаций под заголовки.

```tsx
import { Markdown } from "@web-core/ui";

const doc = `# Первый уровень

### Третий уровень

1. раз
2. два

- маркированный
`;

export function StatesMarkdownDemo() {
  return <Markdown data-variant="xxx" text={doc} />;
}
```

Полезно проверить: у заголовков `data-level="1"` и `"3"` (и настоящие теги `H1`/`H3`), у
нумерованного списка `data-ordered="true"` и тег `OL`, у маркированного метки нет вовсе.

## 3. Код внутри строки и код блоком — одна часть, разные метки

```tsx
import { Markdown } from "@web-core/ui";

const doc = `Строка с \`inline\` внутри.

\`\`\`ts
const x = 1;
\`\`\`
`;

export function CodeMarkdownDemo() {
  return <Markdown data-variant="xxx" text={doc} />;
}
```

Полезно проверить: у кода внутри строки стоит `data-inline="true"`, у блока — нет; класс с языком
(`language-ts`) разборщик оставляет на узле как есть, по нему работают подсветчики.

## 4. Таблица и цитата

```tsx
import { Markdown } from "@web-core/ui";

const doc = `> Цитата из чужого текста.

| часть | значение |
| --- | --- |
| root | документ целиком |
| link | ссылка |
`;

export function TableMarkdownDemo() {
  return <Markdown data-variant="xxx" text={doc} />;
}
```

Полезно проверить: таблица получает `data-part="table"`, цитата — `data-part="quote"`. Шапка, строки
и ячейки своих адресов НЕ имеют: правилом скина их вид сегодня не задать (`README.md`, «Состояния»).

## 5. Чужой текст — что кит с ним делает

Документ приходит из источника, которым кит не управляет. Сырая разметка внутри текста не
превращается в узлы вовсе, а адрес ссылки едет как есть — фильтрация недоверенных адресов остаётся
на потребителе.

```tsx
import { Markdown } from "@web-core/ui";

const foreign = `Текст <img src="x" onerror="alert(1)"> дальше.

[ссылка из документа](https://example.test/a)
`;

export function ForeignMarkdownDemo() {
  return <Markdown data-variant="xxx" text={foreign} />;
}
```

Полезно проверить: ни `<img>`, ни `onerror` в DOM нет — сырую разметку разборщик отбрасывает; у
ссылки `href` совпадает с тем, что написано в документе, и стоит `target="_self"`. Подробно — в
[`FAQ.md`](../../FAQ.md) зоны.

## 6. Рендер через движок

Та же вещь по схеме (сборка `basic`): текст приезжает из данных (`/text` по io-схеме), в дереве его
нет. Вид показан вторым аргументом `instanceOf` — это проп корневого узла.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineMarkdownDemo() {
  const data = { text: "# Из данных\n\nАбзац документа." };
  const tree = instanceOf("markdown", { "data-variant": "xxx" }, "basic", data);

  return <RenderTree tree={tree} registry={registry} data={data} />;
}
```

Полезно проверить: поменяйте `data.text` — содержимое поменяется без правки дерева; узлов под
заголовки и абзацы в дереве схемы нет вообще, их растит сам текст.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля, поэтому и вариации, и вид частей документа видны только с
надетой формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со
скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка: настоящий вид живёт записью формы в службе скина.
