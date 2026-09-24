# 🧪 Примеры — как работать с `Workspace`

Рабочий код для локального теста, не канон. Анатомия, настройки и рецепт — [`README.md`](./README.md).
Здесь — то, что можно скопировать и сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — у каркаса он решает, какой слот какую область сетки
> занимает.** Кит по умолчанию не несёт ни одного стиля: без формы скина слоты просто лягут друг за
> другом, и это не поломка. Имя вида придумывает не кит, а форма скина — запись в службе;
> `sidebar-first`/`header-first`/`header-full`/`stacked` ниже это имена проверочного рецепта, в
> своей форме они могут быть другими (те же имена показывает витрина в карточке компонента).

> [!NOTE]
> У компонента нет своих `FAQ.md`/`ROADMAP.yaml` — разборы и план по нему живут в доке зоны
> (`web-core/ui/FAQ.md`, `web-core/ui/ROADMAP.yaml`).

## 1. Ручная сборка — каркас приложения

Самый простой путь: JSX-композиция, без схемы и движка. Слоты кладутся в ЛЮБОМ порядке: куда встанет
каждый, решает форма через `grid-template-areas`, а не порядок в разметке.

```tsx
import {
  Workspace,
  WorkspaceHeader,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";

export function BasicWorkspaceDemo() {
  return (
    <Workspace data-variant="sidebar-first">
      <WorkspaceSidebar>Навигация</WorkspaceSidebar>
      <WorkspaceHeader>Шапка</WorkspaceHeader>
      <WorkspaceMain>Показ</WorkspaceMain>
      <WorkspaceRightbar>Свойства</WorkspaceRightbar>
    </Workspace>
  );
}
```

Полезно проверить: поменяйте порядок слотов в разметке — картинка не изменится. Состояний у частей
нет ни одного: каркас ничего не хранит, он только держит слоты.

## 2. Необязательные слоты — по-настоящему необязательны

Не положили `rightbar` или `footer` — колонка и строка под них схлопываются сами, средствами CSS.
Условие в разметке потребителя для этого не нужно.

```tsx
import { Workspace, WorkspaceHeader, WorkspaceMain } from "@web-core/ui";

export function MinimalWorkspaceDemo() {
  return (
    <Workspace data-variant="stacked">
      <WorkspaceHeader>Шапка</WorkspaceHeader>
      <WorkspaceMain>Показ</WorkspaceMain>
    </Workspace>
  );
}
```

Полезно проверить: вид и композиция должны совпадать по составу слотов. Форма, которая резервирует
три колонки, оставит пустое место, даже если боковых слотов в разметке нет вовсе — именно поэтому у
проверочного рецепта есть отдельный вид `stacked` под композицию «шапка плюс показ».

## 3. Шов между слотами — настройка, а не вид

`outlined` — настоящая настройка паспорта: тонкая линия между занятыми слотами, когда блоки одного
цвета и без неё сливаются.

```tsx
import { Workspace, WorkspaceHeader, WorkspaceMain, WorkspaceSidebar } from "@web-core/ui";

export function OutlinedWorkspaceDemo() {
  return (
    <Workspace data-variant="sidebar-first" outlined>
      <WorkspaceSidebar>Навигация</WorkspaceSidebar>
      <WorkspaceHeader>Шапка</WorkspaceHeader>
      <WorkspaceMain>Показ</WorkspaceMain>
    </Workspace>
  );
}
```

Полезно проверить: шов — это закраска КОРНЯ, проступающая сквозь зазор сетки, плюс свой фон у
каждого занятого слота. Не рамка на каждом слоте: пять независимых рамок дали бы двойную линию на
стыке и нахлёст в точке, где сходятся три-четыре слота.

## 4. Рендер через движок — восемь готовых раскладок

Восемь сборок — узнаваемые схемы рынка, а не выдумка кита: `stacked`, `sidebar`, `sidebar-header`,
`right-rail`, `multi-column`, `dashboard`, `sidebar-footer`, `holy-grail`. Отличаются они составом
слотов.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineWorkspaceDemo() {
  return (
    <RenderTree
      tree={instanceOf("workspace", { "data-variant": "header-first" }, "holy-grail", {})}
      registry={registry}
      data={{}}
    />
  );
}
```

Полезно проверить: своего io у каркаса нет — данных ему не нужно, сборка описывает только состав
слотов. Вид и сборку подбирают в пару: `holy-grail` (все шесть слотов) осмысленно смотрится с
`header-first`, а `stacked` (шапка плюс показ) — со своим одноимённым видом.

## 5. Слоты с реальным содержимым

Каркас ничего не решает за содержимое: внутрь слота кладётся что угодно — своя навигация, чужой
компонент, целое приложение.

```tsx
import { Flow, Surface, Workspace, WorkspaceHeader, WorkspaceMain, WorkspaceSidebar } from "@web-core/ui";

export function FilledWorkspaceDemo() {
  return (
    <Workspace data-variant="sidebar-first" outlined>
      <WorkspaceHeader>
        <Flow data-variant="xxx">
          <strong>Проект</strong>
          <span>Настройки</span>
        </Flow>
      </WorkspaceHeader>

      <WorkspaceSidebar>
        <Flow data-variant="column">
          <a href="#one">Первый раздел</a>
          <a href="#two">Второй раздел</a>
        </Flow>
      </WorkspaceSidebar>

      <WorkspaceMain>
        <Surface data-variant="xxx">Карточка внутри показа</Surface>
      </WorkspaceMain>
    </Workspace>
  );
}
```

Полезно проверить: у каждого слота свой адрес (`[data-part="header"]`, `[data-part="sidebar"]` и так
далее) — именно поэтому каркас это пять именованных частей, а не сетка с одинаковыми ячейками:
правило формы, написанное на общую ячейку, попало бы на все слоты разом.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: сетка, высота шапки, ширина рельсов и подложки слотов
приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со
скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка: настоящая раскладка продукта живёт записью формы в службе скина.
