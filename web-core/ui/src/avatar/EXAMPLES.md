# 🧪 Примеры — как работать с `Avatar`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — картинка с заглушкой

Самый простой путь: JSX-композиция, без схемы и движка. Обе части кладутся всегда — и картинка, и
заглушка: кто из них сейчас виден, решает статус загрузки, а не порядок в разметке.

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@web-core/ui";

export function BasicAvatarDemo() {
  return (
    <Avatar data-variant="xxx">
      <AvatarFallback>ИП</AvatarFallback>
      <AvatarImage src="/people/ivan.jpg" alt="Иван Петров" />
    </Avatar>
  );
}
```

Полезно проверить: в DOM присутствуют ОБА узла (`[data-part="image"]` и `[data-part="fallback"]`),
у скрытого стоит `[data-state="hidden"]` и нативный `[hidden]`. Картинка остаётся в разметке даже
невидимой — иначе браузер не догрузил бы её и переключиться было бы нечему.

## 2. Заглушка — не только инициалы

Внутрь заглушки кладётся что угодно: буквы, символ, настоящая `Icon` кита. Кит своей картинки-
заглушки не несёт и не выдумывает инициалы за вас.

```tsx
import { Avatar, AvatarFallback, AvatarImage, Icon } from "@web-core/ui";

export function FallbackKindsDemo() {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <Avatar data-variant="xxx">
        <AvatarFallback>ИП</AvatarFallback>
        <AvatarImage src="/people/ivan.jpg" alt="Иван Петров" />
      </Avatar>

      <Avatar data-variant="xxx">
        <AvatarFallback>
          <Icon name="user" />
        </AvatarFallback>
        <AvatarImage src="/people/unknown.jpg" alt="Неизвестный" />
      </Avatar>

      <Avatar data-variant="xxx">
        <AvatarFallback>?</AvatarFallback>
        <AvatarImage alt="Без картинки вовсе" />
      </Avatar>
    </div>
  );
}
```

Полезно проверить: у третьего аватара `src` нет вовсе — заглушка остаётся видимой навсегда, и это
законное состояние, а не ошибка загрузки.

## 3. Узнать снаружи, что показалось

`onStatusChange` отдаёт тот же переход, который двигает `image`/`fallback`, — для того, кому надо
знать об этом за пределами компонента (например, чтобы не показывать «фото не загружено» дважды).

```tsx
import { createSignal } from "@web-core/solid";
import { Avatar, AvatarFallback, AvatarImage } from "@web-core/ui";

export function StatusAvatarDemo() {
  const [status, setStatus] = createSignal<string>();

  return (
    <>
      <Avatar data-variant="xxx" onStatusChange={(details) => setStatus(details.status)}>
        <AvatarFallback>ИП</AvatarFallback>
        <AvatarImage src="/people/ivan.jpg" alt="Иван Петров" />
      </Avatar>

      <p>статус: {status() ?? "ещё грузится"}</p>
    </>
  );
}
```

Полезно проверить: в живом браузере статус приходит сам, когда картинка догрузилась или упала. В
jsdom сетевого запроса нет вовсе — событие приходится сымитировать руками
(`image.dispatchEvent(new Event("load"))`) и дождаться шага реактивности (`await
Promise.resolve()`), иначе прочитаете старое значение, см. [`FAQ.md`](./FAQ.md).

## 4. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Адрес картинки, её подпись и
текст заглушки приезжают из данных (`/src`, `/alt`, `/fallback` по io-схеме), в сборке они не
зашиты.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineAvatarDemo() {
  const data = { src: "/people/ivan.jpg", alt: "Иван Петров", fallback: "ИП" };

  return (
    <RenderTree
      tree={instanceOf("avatar", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: `src`/`alt` реально долетают до настоящего `<img>`, текст заглушки — до узла
`fallback`, а адреса `[data-scope="avatar"][data-part="…"]` стоят на обоих. Событий аватар не
поднимает вовсе — `dispatch` ему передавать незачем.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: круглая форма, размер и то, что картинка с заглушкой
лежат друг поверх друга, приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где
кит подключён вместе со скином.

Проверочный рецепт из `playground/recipe.ts` — доказательство, что паспорт одевается целиком, а не
поставка. Полный рабочий прогон переключения `load`/`error` — `test/avatar.test.tsx`.
