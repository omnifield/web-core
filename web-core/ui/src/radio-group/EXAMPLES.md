# 🧪 Примеры — как работать с `RadioGroup`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — один вариант из нескольких

Самый простой путь: JSX-композиция, без схемы и движка. Скрытый `<input type="radio">` класть не
нужно — его несёт каждый `RadioGroupItem` сам; `indicator` кладётся ОДИН на весь набор, рядом с
пунктами, а не внутрь каждого.

```tsx
import {
  RadioGroup,
  RadioGroupIndicator,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
  RadioGroupLabel,
} from "@web-core/ui";

export function BasicRadioGroupDemo() {
  return (
    <RadioGroup data-variant="xxx" defaultValue="standard">
      <RadioGroupLabel>Доставка</RadioGroupLabel>

      <RadioGroupItem value="standard">
        <RadioGroupItemControl />
        <RadioGroupItemText>Обычная</RadioGroupItemText>
      </RadioGroupItem>

      <RadioGroupItem value="express">
        <RadioGroupItemControl />
        <RadioGroupItemText>Срочная</RadioGroupItemText>
      </RadioGroupItem>

      <RadioGroupIndicator />
    </RadioGroup>
  );
}
```

Полезно проверить: выбранный пункт помечен `[data-state="checked"]` (на самом `item`, его тексте и
кружке), остальные — `unchecked`. Указатель не переставляется по пунктам, а ЕДЕТ: кит меряет
выбранный пункт и пишет его геометрию в `--left`/`--top`/`--width`/`--height`, рецепт центрирует
точку внутри этого прямоугольника.

## 2. Управляемый выбор и ориентация

Значение держит внешний сигнал, `orientation` разворачивает набор в строку — и меняет не только
вид, но и то, какими стрелками ходит клавиатура.

```tsx
import { createSignal, For } from "@web-core/solid";
import {
  RadioGroup,
  RadioGroupIndicator,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
  RadioGroupLabel,
} from "@web-core/ui";

const plans = [
  { value: "free", label: "Бесплатный" },
  { value: "pro", label: "Профессиональный" },
  { value: "team", label: "Командный" },
];

export function ControlledRadioGroupDemo() {
  const [plan, setPlan] = createSignal("pro");

  return (
    <>
      <RadioGroup
        data-variant="xxx"
        orientation="horizontal"
        value={plan()}
        onValueChange={(details) => setPlan(details.value)}
      >
        <RadioGroupLabel>Тариф</RadioGroupLabel>
        <For each={plans}>
          {(item) => (
            <RadioGroupItem value={item.value}>
              <RadioGroupItemControl />
              <RadioGroupItemText>{item.label}</RadioGroupItemText>
            </RadioGroupItem>
          )}
        </For>
        <RadioGroupIndicator />
      </RadioGroup>

      <p>выбран тариф: {plan()}</p>
    </>
  );
}
```

Полезно проверить: на корне появился `data-orientation="horizontal"`, стрелки ←/→ двигают выбор, а
`Tab` заходит в набор и выходит из него ОДНИМ прыжком — фокус внутри стоит только на выбранном
пункте.

## 3. Один вариант недоступен, остальные работают

`disabled` на самом наборе и `disabled` на одном пункте — две разные вещи, работающие
одновременно, а не два способа сказать одно.

```tsx
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
} from "@web-core/ui";

export function PerItemDisabledDemo() {
  return (
    <RadioGroup data-variant="xxx" defaultValue="standard">
      <RadioGroupItem value="standard">
        <RadioGroupItemControl />
        <RadioGroupItemText>Обычная</RadioGroupItemText>
      </RadioGroupItem>

      <RadioGroupItem value="express" disabled>
        <RadioGroupItemControl />
        <RadioGroupItemText>Срочная — сегодня не возим</RadioGroupItemText>
      </RadioGroupItem>
    </RadioGroup>
  );
}
```

Полезно проверить: `[data-disabled]` стоит только на отключённом пункте, соседний кликается как
обычно. Поставьте `disabled` на сам `<RadioGroup>` — метка появится и на групповых частях
(`root`/`label`), и на всех пунктах сразу.

## 4. Настоящее поле формы

`name` на наборе делает его родным полем: `FormData` подхватывает выбранное значение без обвязки —
за это отвечают те самые скрытые `<input type="radio">` в каждом пункте.

```tsx
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemText,
  RadioGroupLabel,
} from "@web-core/ui";

export function FormRadioGroupDemo() {
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    console.log(data.get("delivery")); // "express"
  };

  return (
    <form onSubmit={submit}>
      <RadioGroup data-variant="xxx" name="delivery" defaultValue="express" required>
        <RadioGroupLabel>Доставка</RadioGroupLabel>

        <RadioGroupItem value="standard">
          <RadioGroupItemControl />
          <RadioGroupItemText>Обычная</RadioGroupItemText>
        </RadioGroupItem>

        <RadioGroupItem value="express">
          <RadioGroupItemControl />
          <RadioGroupItemText>Срочная</RadioGroupItemText>
        </RadioGroupItem>
      </RadioGroup>

      <button type="submit">Отправить</button>
    </form>
  );
}
```

Полезно проверить: `required` ставит `[data-required]` на групповые части (`root`/`label`), а не на
каждый пункт — обязателен весь набор, а не отдельный вариант.

## 5. Своя разметка пункта — `asChild`

Когда разметку пункта задаёт потребитель, автоматическая подстановка скрытого ввода выключается
вместе со всей стандартной разметкой — поэтому `RadioGroupItemHiddenInput` и остаётся публичным.

```tsx
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemHiddenInput,
  RadioGroupItemText,
} from "@web-core/ui";

export function AsChildRadioGroupDemo() {
  return (
    <RadioGroup data-variant="xxx" defaultValue="standard">
      <RadioGroupItem value="express" asChild>
        <label>
          <RadioGroupItemHiddenInput />
          <RadioGroupItemText>
            <RadioGroupItemControl />
            Срочная
          </RadioGroupItemText>
        </label>
      </RadioGroupItem>
    </RadioGroup>
  );
}
```

Полезно проверить: без `RadioGroupItemHiddenInput` такой пункт перестаёт выбираться с клавиатуры и
исчезает из `FormData` — визуально при этом выглядит рабочим, поэтому промах легко не заметить.

## 6. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Подпись и пункты приезжают из
данных (`/label`, `/items` по io-схеме), изначально не выбрано ничего.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineRadioGroupDemo() {
  const data = {
    label: "Доставка",
    items: [
      { value: "standard", label: "Обычная" },
      { value: "express", label: "Срочная" },
    ],
  };

  return (
    <RenderTree
      tree={instanceOf("radio-group", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: клик по пункту реально переключает выбор — набор ведёт его сам и наружу схемы
событий не отдаёт (io-выход пуст, `dispatch` ему не нужен). Начальное значение задаётся пропом
корня: `instanceOf("radio-group", { "data-variant": "xxx", defaultValue: "express" }, …)`.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: кружки, точка указателя и её движение к выбранному
пункту приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён
вместе со скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка. Полный рабочий прогон — `test/radio-group.test.tsx`.
