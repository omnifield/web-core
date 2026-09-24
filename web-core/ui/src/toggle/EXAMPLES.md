# 🧪 Примеры — как работать с `Toggle`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — кнопка с двумя устойчивыми состояниями

Самый простой путь: JSX-композиция, без схемы и движка. Тумблер — одна кнопка, которая помнит, что
её нажали; глиф внутрь кладёт потребитель.

```tsx
import { Toggle, ToggleIndicator } from "@web-core/ui";

export function BasicToggleDemo() {
  return (
    <Toggle data-variant="xxx" defaultPressed>
      <ToggleIndicator>★</ToggleIndicator>
    </Toggle>
  );
}
```

Полезно проверить: в DOM настоящая `<button>` с `aria-pressed="true"`, и тот же факт продублирован
`[data-state="on"]` и `[data-pressed]` — три независимые метки одного и того же, любую можно брать в
рецепт (для стилей — `data-*`, `aria-pressed` живёт ради ассистивных технологий).

## 2. Разный глиф на каждое состояние

`fallback` индикатора рисует содержимое для НЕнажатого состояния, дети — для нажатого. Руками
переключать ничего не надо: за какое состояние что показать, знает сам индикатор.

```tsx
import { createSignal } from "@web-core/solid";
import { Icon, Toggle, ToggleIndicator } from "@web-core/ui";

export function GlyphPerStateToggleDemo() {
  const [pressed, setPressed] = createSignal(false);

  return (
    <Toggle data-variant="xxx" pressed={pressed()} onPressedChange={setPressed}>
      <ToggleIndicator fallback={<Icon name="eye-off" />}>
        <Icon name="eye" />
      </ToggleIndicator>
    </Toggle>
  );
}
```

Полезно проверить: клик реально меняет содержимое индикатора — это `fallback`, а не два узла, где
один спрятан. Если глиф один и тот же в обоих состояниях, `fallback` не нужен вовсе.

## 3. Отключённый тумблер

`disabled` выключает нажатие, при этом уже выставленная нажатость остаётся видимой — «нажат, но
трогать нельзя» законное сочетание.

```tsx
import { Toggle, ToggleIndicator } from "@web-core/ui";

export function DisabledToggleDemo() {
  return (
    <Toggle data-variant="xxx" disabled defaultPressed>
      <ToggleIndicator>★</ToggleIndicator>
    </Toggle>
  );
}
```

Полезно проверить: `[data-disabled]` стоит и на кнопке, и на индикаторе — глиф несёт состояние
независимо, а не наследует вид от кнопки (разбор — [`FAQ.md`](./FAQ.md)). Наведение, фокус и
нажатие при этом читаются обычными псевдоклассами: они живут только на самой кнопке.

## 4. Рендер через движок — сборка `basic`

Та же кнопка, но собранная по схеме и нарисованная `RenderTree`. Глиф приезжает из данных (`/glyph`
по io-схеме), начальная нажатость объявлена в самой сборке статичным пропом.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineToggleDemo() {
  const data = { glyph: "★" };

  return (
    <RenderTree
      tree={instanceOf("toggle", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: клик по кнопке реально меняет `data-state` с `on` на `off` — состояние ведёт сам
тумблер, наружу схемы события не отдаёт (io-выход пуст, `dispatch` ему не нужен). Разный глиф на
состояние схемой не задаётся — это сценарий ручной композиции, пример 2.

## 5. Не путать с набором кнопок

Тумблер — ОДНА кнопка сама по себе. Если нужен набор, где нажатой может быть только одна (или
несколько из фиксированного списка), это другой компонент — `ToggleGroup`, со своим значением и
своей клавиатурной навигацией.

```tsx
import { ToggleGroup, ToggleGroupItem } from "@web-core/ui";

export function NotAToggleDemo() {
  return (
    <ToggleGroup data-variant="xxx" defaultValue={["left"]}>
      <ToggleGroupItem value="left">◀</ToggleGroupItem>
      <ToggleGroupItem value="center">■</ToggleGroupItem>
      <ToggleGroupItem value="right">▶</ToggleGroupItem>
    </ToggleGroup>
  );
}
```

Полезно проверить: в группе стрелки ←/→ переводят фокус между кнопками, а значение общее на весь
набор — у одиночного тумблера ни того, ни другого нет и быть не должно.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: акцентный фон нажатого и приглушённый глиф ненажатого
приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со
скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка. Полный рабочий прогон (включая `fallback`) — `test/toggle.test.tsx`.
