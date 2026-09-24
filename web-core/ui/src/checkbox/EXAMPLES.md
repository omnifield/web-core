# 🧪 Примеры — как работать с `Checkbox`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — отметка с подписью

Самый простой путь: JSX-композиция, без схемы и движка. Скрытый `<input type="checkbox">` класть не
нужно — его кладёт сам корень; галочку внутрь рамки кладёт потребитель, своей графики кит не несёт.

```tsx
import { Checkbox, CheckboxControl, CheckboxIndicator, CheckboxLabel } from "@web-core/ui";

export function BasicCheckboxDemo() {
  return (
    <Checkbox data-variant="xxx">
      <CheckboxControl>
        <CheckboxIndicator>✓</CheckboxIndicator>
      </CheckboxControl>
      <CheckboxLabel>Согласен с условиями</CheckboxLabel>
    </Checkbox>
  );
}
```

Полезно проверить: кликабельна вся строка — клик по ПОДПИСИ переключает отметку так же, как клик по
квадрату (корень это настоящий `<label>`). Пока отметки нет, указатель несёт нативный `[hidden]`, а
на всех четырёх частях стоит `[data-state="unchecked"]`.

## 2. Третье состояние — «отчасти»

Два указателя рядом: обычный и помеченный `indeterminate`. Показывается ровно тот, чьё состояние
сейчас у чекбокса, второй прячется — оба при этом всегда в разметке, переключение чисто визуальное.

```tsx
import { createSignal } from "@web-core/solid";
import { Checkbox, CheckboxControl, CheckboxIndicator, CheckboxLabel } from "@web-core/ui";

export function IndeterminateCheckboxDemo() {
  const [state, setState] = createSignal<boolean | "indeterminate">("indeterminate");

  return (
    <Checkbox
      data-variant="xxx"
      checked={state()}
      onCheckedChange={(details) => setState(details.checked)}
    >
      <CheckboxControl>
        <CheckboxIndicator>✓</CheckboxIndicator>
        <CheckboxIndicator indeterminate>–</CheckboxIndicator>
      </CheckboxControl>
      <CheckboxLabel>Выбрать всё</CheckboxLabel>
    </Checkbox>
  );
}
```

Полезно проверить: в разметке два узла `[data-part="indicator"]`, `hidden` стоит ровно на одном из
них; на корне `[data-state="indeterminate"]`. Типичный живой случай — родительский чекбокс над
списком, где отмечена часть потомков: сумму считает потребитель, кит только показывает.

## 3. Настоящее поле формы

`name`/`value` делают чекбокс родным полем: `FormData` подхватывает его без единой строчки обвязки,
потому что скрытый `<input>` — настоящий.

```tsx
import { Checkbox, CheckboxControl, CheckboxIndicator, CheckboxLabel } from "@web-core/ui";

export function FormCheckboxDemo() {
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    console.log(data.get("terms")); // "accepted" — или null, если не отмечен
  };

  return (
    <form onSubmit={submit}>
      <Checkbox data-variant="xxx" name="terms" value="accepted" required>
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
        <CheckboxLabel>Согласен с условиями</CheckboxLabel>
      </Checkbox>

      <button type="submit">Отправить</button>
    </form>
  );
}
```

Полезно проверить: отмеченный чекбокс кладёт в `FormData` своё `value` под своим `name`, снятый — не
кладёт ничего (`get("terms") === null`), ровно как нативный. `required` добавляет `[data-required]`
на все части — красить его дело формы скина.

## 4. Недоступные и нередактируемые

`disabled` и `readOnly` — разные вещи: первый выключает чекбокс целиком, второй показывает отметку,
но не даёт её менять.

```tsx
import { Checkbox, CheckboxControl, CheckboxIndicator, CheckboxLabel } from "@web-core/ui";

export function StatesCheckboxDemo() {
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
      <Checkbox data-variant="xxx" disabled>
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
        <CheckboxLabel>Нельзя тронуть</CheckboxLabel>
      </Checkbox>

      <Checkbox data-variant="xxx" readOnly checked>
        <CheckboxControl>
          <CheckboxIndicator>✓</CheckboxIndicator>
        </CheckboxControl>
        <CheckboxLabel>Видно, но не переключить</CheckboxLabel>
      </Checkbox>
    </div>
  );
}
```

Полезно проверить: `[data-disabled]`/`[data-readonly]` появляются на ВСЕХ четырёх частях сразу — у
чекбокса нет части, которая владеет состоянием больше других. И красить их надо атрибутами:
`:hover`/`:focus`/`:active` на видимых узлах не сработают вовсе, потому что настоящий фокус лежит на
скрытом `<input>` (разбор — [`FAQ.md`](./FAQ.md)).

## 5. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Подпись приезжает из данных
(`/label` по io-схеме), галочка в сборке — литеральный символ; скрытый ввод кладёт корень, сборке о
нём знать не нужно.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineCheckboxDemo() {
  const data = { label: "Согласен с условиями" };

  return (
    <RenderTree
      tree={instanceOf("checkbox", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: клик по узлу `[data-part="root"]` реально переключает отметку — состояние ведёт
сам чекбокс, наружу схемы события он не отдаёт (в io-выходе пусто, `dispatch` ему не нужен).
Указатель перестаёт быть `hidden` после клика — это и есть «отмечен», без формы скина других
признаков не будет.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: рамка, акцентная заливка отмеченного и сжатие при
нажатии приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён
вместе со скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка. Полный рабочий прогон (включая `FormData` и два указателя) — `test/checkbox.test.tsx`.

Группового режима (общее имя поля на набор чекбоксов, общий список выбранных, ограничение
максимума) у компонента нет вовсе — это названный пробел, см. [`ROADMAP.yaml`](./ROADMAP.yaml).
