# 🧪 Примеры — как работать с `Field`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — подпись, контрол, подсказка, ошибка

Самый простой путь: JSX-композиция, без схемы и движка. Поле само связывает части доступностью
(`aria-describedby`, `aria-invalid`, `for`/`id`) — расставлять `id` руками не нужно.

```tsx
import {
  Field,
  FieldErrorText,
  FieldHelperText,
  FieldInput,
  FieldLabel,
  FieldRequiredIndicator,
} from "@web-core/ui";

export function BasicFieldDemo() {
  return (
    <Field data-variant="xxx" required invalid>
      <FieldLabel>
        Имя
        <FieldRequiredIndicator />
      </FieldLabel>
      <FieldInput />
      <FieldHelperText>Как в документе</FieldHelperText>
      <FieldErrorText>Поле обязательно</FieldErrorText>
    </Field>
  );
}
```

Полезно проверить: `[data-invalid]`/`[data-required]` разошлись по частям неравномерно — это не
недосмотр, а честное отражение того, что каждая часть умеет выражать (`helperText`, например, несёт
только `disabled`). Уберите `required`/`invalid` — узлы `requiredIndicator`/`errorText` пропадут из
DOM ЦЕЛИКОМ, а не спрячутся стилем.

## 2. Три взаимозаменяемых контрола

`input`/`select`/`textarea` — не три разные части композиции, а три рендерера одного и того же
места: в реальном поле кладётся ровно один. `<select>` при этом обычный нативный, со своими
`<option>` — сборкой такое не задаётся, только руками.

```tsx
import { Field, FieldInput, FieldLabel, FieldSelect, FieldTextarea } from "@web-core/ui";

export function ControlsFieldDemo() {
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
      <Field data-variant="xxx">
        <FieldLabel>Имя</FieldLabel>
        <FieldInput placeholder="Иван" />
      </Field>

      <Field data-variant="xxx">
        <FieldLabel>Страна</FieldLabel>
        <FieldSelect>
          <option value="ru">Россия</option>
          <option value="us">США</option>
        </FieldSelect>
      </Field>

      <Field data-variant="xxx">
        <FieldLabel>Комментарий</FieldLabel>
        <FieldTextarea rows={3} />
      </Field>
    </div>
  );
}
```

Полезно проверить: на контроле смешаны метки двух родов — `invalid`/`required`/`readonly` приезжают
атрибутами (это состояния ПОЛЯ, спущенные вниз), а `disabled`/`hover`/`focus`/`focus-visible`
остаются нативными псевдоклассами: контрол настоящий, браузер их и так отслеживает
([`FAQ.md`](./FAQ.md)).

## 3. Валидность приезжает сама — ось форм

Если узел поля заведён своим `data-node` внутри `<ValidationProvider>`, `invalid` и текст ошибки
доезжают сами из io-схемы сборки: руками их передавать не нужно вовсе.

```tsx
import { ValidationProvider } from "@web-core/form/solid";
import { z } from "@web-core/io";
import { createSignal } from "@web-core/solid";
import { Field, FieldErrorText, FieldInput, FieldLabel } from "@web-core/ui";

const schema = z.object({ email: z.string().email() });

const tree = {
  components: {
    root: "email",
    nodes: {
      email: { id: "email", type: "field", parentId: null, children: [], bind: { value: "/email" } },
    },
  },
};

export function ValidatedFieldDemo() {
  const [data, setData] = createSignal({ email: "not-an-email" });

  return (
    <ValidationProvider tree={tree} schema={schema} data={data}>
      <Field data-variant="xxx" data-node="email">
        <FieldLabel>Почта</FieldLabel>
        <FieldInput value={data().email} onInput={(e) => setData({ email: e.currentTarget.value })} />
        <FieldErrorText data-node="email" />
      </Field>
    </ValidationProvider>
  );
}
```

Полезно проверить: `[data-invalid]` появляется и снимается реактивно, по самим данным; текст ошибки
`FieldErrorText` берёт сам (свой `data-node` обязателен — без него акцессор пуст и остаётся ваш
текст-ребёнок). Когда поле становится валидным, узел ошибки исчезает целиком — это `<Show>` самого
Ark внутри `FieldErrorText`, не наша механика. Без `<ValidationProvider>` в дереве всё это тихий
no-op: кит обязан жить и без формы вовсе.

## 4. Чужой контрол через контекст

Ни `input`, ни `select`, ни `textarea` не подходят — контрол берёт пропсы поля сам, через контекст.
Тем же способом внутрь поля кладутся кит-компоненты (`Checkbox` и подобные): они читают контекст
самостоятельно.

```tsx
import { Field, FieldContext, FieldErrorText, FieldLabel } from "@web-core/ui";

export function ForeignControlFieldDemo() {
  return (
    <Field data-variant="xxx" invalid>
      <FieldLabel>Любой контрол</FieldLabel>
      <FieldContext>{(context) => <input {...context().getInputProps()} />}</FieldContext>
      <FieldErrorText>В поле ошибка</FieldErrorText>
    </Field>
  );
}
```

Полезно проверить: чужой `<input>` получил `aria-describedby`/`aria-invalid` от поля, хотя частью
анатомии он не является — доступность собирает поле, а не контрол.

## 5. Повторяющиеся поля — `FieldItem`

Несколько полей повторяют одну композицию, но адресоваться должны независимо. `FieldItem` своего
узла не рисует — только переставляет `id` вложенным частям, чтобы адреса доступности не
конфликтовали.

```tsx
import { For } from "@web-core/solid";
import { Field, FieldInput, FieldItem, FieldLabel } from "@web-core/ui";

export function RepeatedFieldDemo() {
  const participants = ["Первый", "Второй", "Третий"];

  return (
    <Field data-variant="xxx">
      <For each={participants}>
        {(name) => (
          <FieldItem>
            <FieldLabel>{name} участник</FieldLabel>
            <FieldInput />
          </FieldItem>
        )}
      </For>
    </Field>
  );
}
```

Полезно проверить: у каждой подписи свой `for`, указывающий на свой контрол — клик по подписи
ставит фокус в СВОЙ инпут, а не в первый. В анатомии `FieldItem` не появляется вовсе: узла нет,
адресовать и красить нечего.

## 6. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Подпись, подсказка и текст
ошибки приезжают из данных (`/label`, `/helperText`, `/errorText` по io-схеме), а `required`/
`invalid` — пропами корня, не данными.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineFieldDemo() {
  const data = { label: "Имя", helperText: "Как в документе", errorText: "Поле обязательно" };
  const tree = instanceOf(
    "field",
    { "data-variant": "xxx", required: true, invalid: true },
    "basic",
    data,
  );

  return <RenderTree tree={tree} registry={registry} data={data} />;
}
```

Полезно проверить: в разметке есть и «*» (`requiredIndicator`), и текст ошибки — оба смонтированы
ровно потому, что поле объявлено обязательным и невалидным. Снимите один из пропов — соответствующий
узел исчезнет из DOM. Событий поле наружу схемы не отдаёт, `dispatch` ему не нужен.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: рамка контрола, цвет невалидного, отступы между
подписью и полем приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит
подключён вместе со скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка. Полный рабочий прогон — `test/field.test.tsx` и `test/field-validation.test.tsx`.
