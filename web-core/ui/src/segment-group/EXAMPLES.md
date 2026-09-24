# 🧪 Примеры — как работать с `SegmentGroup`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — ряд сегментов

Самый простой путь: JSX-композиция, без схемы и движка. Скрытый `<input type="radio">` класть не
нужно — его несёт каждый сегмент сам; пилюля-указатель кладётся ОДНА на весь набор и стоит ПЕРЕД
сегментами: более поздние соседи перекрывают ранних, поэтому подписи оказываются поверх пилюли без
всякого `z-index`.

```tsx
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
  SegmentGroupLabel,
} from "@web-core/ui";

export function BasicSegmentGroupDemo() {
  return (
    <SegmentGroup data-variant="xxx" defaultValue="list">
      <SegmentGroupLabel>Вид</SegmentGroupLabel>
      <SegmentGroupIndicator />

      <SegmentGroupItem value="list">
        <SegmentGroupItemControl />
        <SegmentGroupItemText>Список</SegmentGroupItemText>
      </SegmentGroupItem>

      <SegmentGroupItem value="grid">
        <SegmentGroupItemControl />
        <SegmentGroupItemText>Плитка</SegmentGroupItemText>
      </SegmentGroupItem>
    </SegmentGroup>
  );
}
```

Полезно проверить: выбранный сегмент помечен `[data-state="checked"]` на себе, своём тексте и своей
поверхности. Пилюля не перерисовывается на каждом сегменте, а ЕДЕТ: кит меряет выбранный сегмент и
пишет геометрию в `--left`/`--top`/`--width`/`--height`, а рецепт растягивает пилюлю на весь этот
прямоугольник.

## 2. Управляемый выбор — переключатель режима показа

Самый частый живой сценарий: сегменты решают, чем рисуется соседний блок.

```tsx
import { createSignal, For, Show } from "@web-core/solid";
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";

const modes = [
  { value: "list", label: "Список" },
  { value: "grid", label: "Плитка" },
  { value: "board", label: "Доска" },
];

export function ControlledSegmentGroupDemo() {
  const [mode, setMode] = createSignal("list");

  return (
    <>
      <SegmentGroup
        data-variant="xxx"
        value={mode()}
        onValueChange={(details) => setMode(details.value)}
      >
        <SegmentGroupIndicator />
        <For each={modes}>
          {(item) => (
            <SegmentGroupItem value={item.value}>
              <SegmentGroupItemControl />
              <SegmentGroupItemText>{item.label}</SegmentGroupItemText>
            </SegmentGroupItem>
          )}
        </For>
      </SegmentGroup>

      <Show when={mode() === "grid"} fallback={<p>рисуем списком</p>}>
        <p>рисуем плиткой</p>
      </Show>
    </>
  );
}
```

Полезно проверить: `onValueChange` отдаёт `details.value` строкой — выбран всегда ровно один
сегмент, пустого состояния у набора нет. Клик срабатывает по всей площади сегмента, не только по
подписи.

## 3. Столбец вместо ряда

`orientation` меняет не только раскладку, но и то, какими стрелками ходит клавиатура — это
настоящая настройка паспорта, и рецепт одевает её отдельно.

```tsx
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
} from "@web-core/ui";

export function VerticalSegmentGroupDemo() {
  return (
    <SegmentGroup data-variant="xxx" orientation="vertical" defaultValue="day">
      <SegmentGroupIndicator />

      <SegmentGroupItem value="day">
        <SegmentGroupItemControl />
        <SegmentGroupItemText>День</SegmentGroupItemText>
      </SegmentGroupItem>

      <SegmentGroupItem value="week">
        <SegmentGroupItemControl />
        <SegmentGroupItemText>Неделя</SegmentGroupItemText>
      </SegmentGroupItem>
    </SegmentGroup>
  );
}
```

Полезно проверить: на корне `data-orientation="vertical"`, выбор двигают стрелки ↑/↓, а пилюля едет
по вертикали — она берёт измеренный бокс сегмента целиком, поэтому ось ей менять не нужно.

## 4. Один сегмент недоступен

`disabled` на наборе и `disabled` на одном сегменте — разные вещи, работающие одновременно.

```tsx
import { SegmentGroup, SegmentGroupItem, SegmentGroupItemControl, SegmentGroupItemText } from "@web-core/ui";

export function PerItemDisabledSegmentDemo() {
  return (
    <SegmentGroup data-variant="xxx" defaultValue="list">
      <SegmentGroupItem value="list">
        <SegmentGroupItemControl />
        <SegmentGroupItemText>Список</SegmentGroupItemText>
      </SegmentGroupItem>

      <SegmentGroupItem value="board" disabled>
        <SegmentGroupItemControl />
        <SegmentGroupItemText>Доска — в этом тарифе нет</SegmentGroupItemText>
      </SegmentGroupItem>
    </SegmentGroup>
  );
}
```

Полезно проверить: `[data-disabled]` только на отключённом сегменте; соседний кликается как обычно.
Тот же флаг на самом `<SegmentGroup>` гасит весь набор и добавляет метку в том числе на `indicator`
— единственное состояние, которое пилюля вообще несёт.

## 5. Настоящее поле формы

`name` делает набор родным полем: значение подхватывается `FormData` без обвязки — за это отвечают
скрытые `<input type="radio">` в сегментах.

```tsx
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
  SegmentGroupLabel,
} from "@web-core/ui";

export function FormSegmentGroupDemo() {
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    console.log(data.get("view")); // "list"
  };

  return (
    <form onSubmit={submit}>
      <SegmentGroup data-variant="xxx" name="view" defaultValue="list">
        <SegmentGroupLabel>Вид</SegmentGroupLabel>
        <SegmentGroupIndicator />

        <SegmentGroupItem value="list">
          <SegmentGroupItemControl />
          <SegmentGroupItemText>Список</SegmentGroupItemText>
        </SegmentGroupItem>

        <SegmentGroupItem value="grid">
          <SegmentGroupItemControl />
          <SegmentGroupItemText>Плитка</SegmentGroupItemText>
        </SegmentGroupItem>
      </SegmentGroup>

      <button type="submit">Сохранить</button>
    </form>
  );
}
```

Полезно проверить: при `asChild` на сегменте скрытый ввод перестаёт подставляться сам — его надо
положить руками (`SegmentGroupItemHiddenInput`), иначе сегмент выглядит рабочим, но из формы
пропадает.

## 6. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Подпись и сегменты приезжают
из данных (`/label`, `/items` по io-схеме), изначально не выбрано ничего.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineSegmentGroupDemo() {
  const data = {
    label: "Вид",
    items: [
      { value: "list", label: "Список" },
      { value: "grid", label: "Плитка" },
      { value: "board", label: "Доска" },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("segment-group", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: клик по сегменту переключает выбор — набор ведёт его сам, наружу схемы событий
не отдаёт (io-выход пуст, `dispatch` не нужен). Начальный выбор задаётся пропом корня:
`instanceOf("segment-group", { "data-variant": "xxx", defaultValue: "grid" }, …)`.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: трек, пилюля и её движение к выбранному сегменту
приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со
скином.

Машина у сегментов та же, что у `RadioGroup`, — разница только в рецепте: пилюля вместо ряда
кружков. Если состояние ведёт себя не так, как здесь описано, сверяйтесь с `radio-group`: расхождение
между их доками означало бы ошибку в одной из них, а не разное поведение. Полный рабочий прогон —
`test/segment-group.test.tsx`.
