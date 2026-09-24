# 🧪 Примеры — как работать с `Button`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; `primary`/`quiet`/`danger` ниже это имена из
> проверочного рецепта, в своей форме они могут быть другими (те же имена показывает витрина в
> карточке компонента). Атрибут ставится на КОРЕНЬ компонента, и по нему же компонент просит у
> скина ровно этот кусок CSS.

## 1. Ручная сборка — подпись и клик

Самый простой путь: JSX-композиция, без схемы и движка. Кнопка — один узел, внутрь кладётся что
угодно: текст, иконка, или то и другое сразу.

```tsx
import { Button } from "@web-core/ui";

export function BasicButtonDemo() {
  return (
    <Button data-variant="xxx" onClick={() => console.log("сохранил")}>
      Сохранить
    </Button>
  );
}
```

Полезно проверить: в DOM настоящий `<button type="button">` с адресом
`[data-scope="button"][data-part="root"]` — по нему скин и находит своё правило.

## 2. Вид — атрибут, а не проп

Имена видов кит не хранит: вид приезжает `data-variant` как есть, а что он значит, решает форма
скина. Не передали вид — атрибута не будет вовсе, дефолтного имени у кита нет.

```tsx
import { Button } from "@web-core/ui";

export function VariantsDemo() {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <Button data-variant="primary">Оформить заказ</Button>
      <Button data-variant="quiet">Отложить</Button>
      <Button data-variant="danger">Удалить</Button>
      <Button>Без вида вовсе</Button>
    </div>
  );
}
```

Полезно проверить: у первых трёх узлов `data-variant` долетел до DOM, у четвёртого атрибута нет
(`hasAttribute("data-variant") === false`). Видимая разница появится только с надетой формой скина
— кит по умолчанию не несёт ни одного стиля.

## 3. Другим тегом — `as`

`as` меняет корневой элемент, адрес и вид при этом остаются кнопкиными: ссылка, выглядящая
кнопкой, — обычная потребность, а не обходной путь.

```tsx
import { Button } from "@web-core/ui";

export function AsAnchorDemo() {
  return (
    <Button as="a" href="/orders" data-variant="primary">
      Открыть заказы
    </Button>
  );
}
```

Полезно проверить: в DOM `A` с настоящим `href`, но `data-scope="button"`/`data-part="root"` на
нём же. Предел приёма — `as` на ДРУГОЙ компонент кита (`Toggle` и подобные): финальный узел
получает адрес цели, и скин кнопки перестаёт применяться, см. [`FAQ.md`](./FAQ.md).

## 4. Состояния, которые кладут снаружи

`disabled` кнопка знает сама, а `busy`/`expanded`/`pressed` — нет: это факты про то, чем кнопка
управляет, и кладёт их тот, кто владеет этим поведением. Кит их только адресует, чтобы скин мог
покрасить.

```tsx
import { createSignal } from "@web-core/solid";
import { Button } from "@web-core/ui";

export function OutsideStatesDemo() {
  const [open, setOpen] = createSignal(false);
  const [saving, setSaving] = createSignal(false);

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <Button data-variant="xxx" disabled>Нельзя нажать</Button>

      <Button
        data-variant="xxx"
        disabled={saving()}
        aria-busy={saving()}
        onClick={() => setSaving(true)}
      >
        Сохраняю…
      </Button>

      <Button
        data-variant="xxx"
        aria-expanded={open()}
        data-expanded={open() ? "" : undefined}
        onClick={() => setOpen(!open())}
      >
        Раскрыть раздел
      </Button>
    </div>
  );
}
```

Полезно проверить: `[data-disabled]` появляется у первой кнопки, `[aria-busy="true"]` — у второй
вместе с `disabled` (своего `loading`-пропа кит не несёт), `[data-expanded]` у третьей появляется и
пропадает по клику. Пока форма скина не надета, все три состояния различимы только атрибутами.

## 5. Рендер через движок — три сборки

Та же кнопка, но собранная по схеме и нарисованная `RenderTree`. Подпись приезжает из данных
(`/label` по io-схеме), в сборке она не зашита: `base` — просто подпись, `with-icon` — настоящий
`Icon` перед ней, `icon-only` — только иконка, а подпись уходит в `aria-label`.

```tsx
import { For } from "@web-core/solid";
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineButtonDemo() {
  const data = { label: "Готово" };

  return (
    <>
      <For each={["base", "with-icon", "icon-only"]}>
        {(assembly) => (
          <RenderTree
            tree={instanceOf("button", { "data-variant": "xxx" }, assembly, data)}
            registry={registry}
            data={data}
          />
        )}
      </For>
    </>
  );
}
```

Полезно проверить: у `with-icon` внутри кнопки реально появляется
`svg[data-scope="icon"][data-part="root"]` перед текстом (иконка приезжает асинхронно — в тесте
это `vi.waitFor`); у `icon-only` текста нет вовсе, а `aria-label` равен подписи из данных —
доступное имя не теряется.

## 6. Голая ссылка на кнопку в чужой сборке

Кнопка — единственный компонент кита с `selfAssembly`: узел-ссылка без своих `on`/`children`
разворачивает и подпись, и клик сам. Полезная нагрузка возвращается как есть — кнопка её не
смотрит и не меняет.

```tsx
import type { AssemblyTree } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry } = kitComponentRenderer();

const tree: AssemblyTree = {
  components: {
    root: "ref",
    nodes: {
      ref: {
        id: "ref",
        type: "button",
        parentId: "owner",
        children: [],
        props: { "data-variant": "primary" },
        bind: { label: "/title", payload: "/payload" },
      },
    },
  },
};

export function ReferenceButtonDemo() {
  const data = { title: "Открыть раздел", payload: { kind: "section", id: "s1" } };

  return (
    <RenderTree
      tree={tree}
      registry={registry}
      data={data}
      dispatch={(event) => console.log(event.name, event.context)}
    />
  );
}
```

Полезно проверить: клик отдаёт событие `select` с `context.payload`, равным объекту из данных —
ровно тем, что лежал в `/payload`, без обёрток. Вид на узле-ссылке едет собственными `props`
ссылки, подпись — через `bind`, а не пропом в разметке.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля — виды, наведение и нажатие видны только с надетой
формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка: настоящий вид живёт записью формы в службе скина. Полный рабочий прогон всех примеров
выше — `test/button.test.tsx`.
