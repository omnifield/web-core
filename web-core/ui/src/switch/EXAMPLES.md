# 🧪 Примеры — как работать с `Switch`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — тумблер с подписью

Самый простой путь: JSX-композиция, без схемы и движка. Скрытый `<input type="checkbox">` класть не
нужно — его кладёт сам корень; ползунок пустой, своей графики он не носит.

```tsx
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@web-core/ui";

export function BasicSwitchDemo() {
  return (
    <Switch data-variant="xxx">
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
      <SwitchLabel>Уведомления</SwitchLabel>
    </Switch>
  );
}
```

Полезно проверить: кликабельна вся строка — клик по подписи переключает так же, как клик по дорожке
(корень это настоящий `<label>`). На всех четырёх частях сразу меняется `[data-state]` с
`unchecked` на `checked`.

## 2. Управляемый переключатель — действие сразу по клику

Переключатель для настроек, которые применяются мгновенно: состояние держит внешний сигнал, а
обработчик делает саму работу.

```tsx
import { createSignal } from "@web-core/solid";
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@web-core/ui";

export function ControlledSwitchDemo() {
  const [on, setOn] = createSignal(true);

  return (
    <>
      <Switch
        data-variant="xxx"
        checked={on()}
        onCheckedChange={(details) => {
          setOn(details.checked);
          console.log("сохранил настройку:", details.checked);
        }}
      >
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        <SwitchLabel>Тёмная тема</SwitchLabel>
      </Switch>

      <p>сейчас: {on() ? "включено" : "выключено"}</p>
    </>
  );
}
```

Полезно проверить: `onCheckedChange` отдаёт `details.checked` булевым — третьего состояния, в
отличие от чекбокса, у переключателя нет вовсе. Неуправляемый вариант — `defaultChecked` вместо
`checked`, без обработчика.

## 3. Настоящее поле формы

`name`/`value` делают переключатель родным полем: `FormData` подхватывает его без обвязки, потому
что скрытый `<input>` настоящий.

```tsx
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@web-core/ui";

export function FormSwitchDemo() {
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    console.log(data.get("notifications")); // "on" — или null, если выключен
  };

  return (
    <form onSubmit={submit}>
      <Switch data-variant="xxx" name="notifications" value="on" defaultChecked>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        <SwitchLabel>Уведомления</SwitchLabel>
      </Switch>

      <button type="submit">Сохранить</button>
    </form>
  );
}
```

Полезно проверить: включённый переключатель кладёт своё `value` под своим `name`, выключенный не
кладёт ничего (`get("notifications") === null`) — ровно как нативный чекбокс.

## 4. Недоступный и нередактируемый

`disabled` выключает переключатель целиком, `readOnly` оставляет значение видимым, но не даёт его
менять.

```tsx
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from "@web-core/ui";

export function StatesSwitchDemo() {
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
      <Switch data-variant="xxx" disabled>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        <SwitchLabel>Недоступно</SwitchLabel>
      </Switch>

      <Switch data-variant="xxx" readOnly defaultChecked>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
        <SwitchLabel>Видно, но не переключить</SwitchLabel>
      </Switch>
    </div>
  );
}
```

Полезно проверить: `[data-disabled]`/`[data-readonly]` появляются на всех четырёх частях сразу. И
красить состояния надо атрибутами — `:hover`/`:focus`/`:active` на видимых узлах не сработают, у
них нет ни фокуса, ни нативной наводимости (разбор — [`FAQ.md`](./FAQ.md)).

## 5. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Подпись приезжает из данных
(`/label` по io-схеме); начальное положение задаётся пропом корня при инстанцировании, а не схемой.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineSwitchDemo() {
  const data = { label: "Уведомления" };
  const tree = instanceOf("switch", { "data-variant": "xxx", defaultChecked: true }, "basic", data);

  return <RenderTree tree={tree} registry={registry} data={data} />;
}
```

Полезно проверить: клик по узлу `[data-part="root"]` реально переключает состояние — переключатель
ведёт его сам, наружу схемы события не отдаёт (io-выход пуст, `dispatch` ему не нужен). Второй
аргумент `instanceOf` — это пропы КОРНЯ: туда же уходят `name`/`value`/`disabled`, если нужны.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: дорожка, акцентная заливка включённого и сам ход
ползунка приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён
вместе со скином.

Ползунок именно скользит (`transform`), а не перекладывается: у переключателя ровно два крайних
положения, и ход посчитан арифметикой в рецепте, а не измеряется в рантайме, как указатель табов.
Полный рабочий прогон — `test/switch.test.tsx`.
