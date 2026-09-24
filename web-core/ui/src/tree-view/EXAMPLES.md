# 🧪 Примеры — как работать с `TreeView`

Рабочий код для локального теста, не канон. Анатомия, состояния и рецепт — [`README.md`](./README.md).
Здесь — то, что можно скопировать и сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Проверочный
> рецепт самого кита оси вида не несёт вовсе — он доказывает паспорт, а не поставляет вид.

> [!NOTE]
> У компонента нет своих `FAQ.md`/`ROADMAP.yaml` — разборы и план по нему живут в доке зоны
> (`web-core/ui/FAQ.md`, `web-core/ui/ROADMAP.yaml`).

## 1. Рендер через движок — сборка `base`

С дерева удобнее начинать именно отсюда: узлы приезжают из данных, а вложенность разворачивает сам
движок по `children` — схема написана ОДИН раз и работает на любой глубине.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineTreeDemo() {
  const data = {
    items: [
      {
        value: "src",
        label: "src",
        children: [
          { value: "index", label: "index.ts" },
          { value: "ui", label: "ui", children: [{ value: "button", label: "button.tsx" }] },
        ],
      },
      { value: "readme", label: "README.md" },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("tree-view", { "data-variant": "xxx" }, "base", data)}
      registry={registry}
      data={data}
      dispatch={(event) => console.log(event.name, event.context)}
    />
  );
}
```

Полезно проверить: клик по шапке узла отдаёт событие `controlClick`, и в `context.payload` лежит
строка данных узла целиком (без детей). Глубину задают ДАННЫЕ, а не схема: те же два узла схемы
разворачиваются и на два уровня, и на десять.

## 2. Данные — канонический `item`

Узел дерева называется так же, как элемент любого другого списка кита: `value`/`label`/`children?`.
Отдельного `id` у дерева нет — это общий канон, а не частность компонента.

```tsx
const data = {
  items: [
    {
      value: "docs",
      label: "Документы",
      children: [
        { value: "contract", label: "Договор.pdf" },
        { value: "invoice", label: "Счёт.pdf" },
      ],
    },
  ],
};
```

Полезно проверить: корень строит коллекцию из `items` сам — в сборке `base` он получает их через
`bind: { items: "/items" }` на КОРНЕВОМ узле. Без этой привязки коллекция окажется пустой, и узлы
не смогут узнать о себе ничего: это уже ловилось живьём.

## 3. Лист становится веткой на лету

Узлу дали первого ребёнка — он тут же становится раскрывающейся веткой, со всем, что под ним уже
смонтировано. И наоборот. Проверять это надо на меняющихся данных, а не на статичном дереве.

```tsx
import { createSignal } from "@web-core/solid";
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function GrowingTreeDemo() {
  const [data, setData] = createSignal({ items: [{ value: "a", label: "Пока лист" }] });

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setData({
            items: [
              { value: "a", label: "Уже ветка", children: [{ value: "a1", label: "Первый ребёнок" }] },
            ],
          })
        }
      >
        Добавить ребёнка
      </button>

      <RenderTree
        tree={instanceOf("tree-view", { "data-variant": "xxx" }, "base", data())}
        registry={registry}
        data={data()}
      />
    </>
  );
}
```

Полезно проверить: до клика у узла нет `data-state` вовсе (лист), после — появляется
`data-state="closed"`, и клик по шапке раскрывает его (`"open"`). Консоль при этом остаётся чистой:
переход листа в ветку меняет саму обёртку узла, и это законный, проверенный путь.

## 4. Своё содержимое узла — через слот

Дерево схемное, но `content` рисует живой компонент из кода: слот получает разрешённые данные
СВОЕГО узла, то есть у каждой ветки своё.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function SlotTreeDemo() {
  const data = { items: [{ value: "a", label: "Alpha", children: [{ value: "b", label: "Beta" }] }] };

  return (
    <RenderTree
      tree={instanceOf("tree-view", { "data-variant": "xxx" }, "base", data)}
      registry={registry}
      data={data}
      slots={{
        "tree-view.content": { placement: "replace", render: (resolved) => <NodePreview node={resolved} /> },
      }}
    />
  );
}
```

Полезно проверить: ключ слота — `"<компонент>.<часть>"`, и `placement: "replace"` ставит ваш рендер
ВМЕСТО содержимого узла. Осторожно: заменив `content`, вы заменяете и место, куда движок кладёт
детей — вложенность в этом поддереве дальше рисуете вы.

## 5. Ручная сборка

Путь для случая, когда дерево строится кодом, а не данными. Дерево — единственный компонент, где
ручная композиция заметно многословнее схемной, поэтому её берут редко.

```tsx
import { TreeContent, TreeControl, TreeControlIndicator, TreeItem, TreeRoot } from "@web-core/ui";

export function ManualTreeDemo() {
  return (
    <TreeRoot data-variant="xxx" items={[{ value: "a", label: "Alpha" }]}>
      <TreeItem>
        <TreeControl>
          Alpha
          <TreeControlIndicator />
        </TreeControl>
        <TreeContent />
      </TreeItem>
    </TreeRoot>
  );
}
```

Полезно проверить: корень строит коллекцию из `items` и здесь тоже — без них узлы окажутся не в
коллекции, и компонент не сможет сказать про них ничего (ни раскрытия, ни выделения).

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: отступ уровня, шеврон раскрытия, подсветка выделенной
строки приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён
вместе со скином.

Деталь для авторов форм: отступ считается ОДНОЙ формулой на `item` (`calc(var(--space-3) +
var(--depth) * var(--space-6))`), а шапка достаёт её через `ancestors`, а не читает `--depth` сама —
проверка скина не берёт наследование браузера на веру. И `display` у `content`/`controlIndicator`
появляется только внутри состояний: безусловный в базе перебил бы нативное скрытие ветки по
специфичности, и ветки перестали бы схлопываться. Полный рабочий прогон — `test/tree-view.test.tsx`.
