# 12. Событие наружу — `dispatch`

**Показываем:** клик внутри нарисованного движком дерева доходит до твоего кода.
**Зачем:** без этого движок рисует красивые, но мёртвые картинки.

## 💻 Код

```tsx
import { createSignal, For } from "@web-core/solid";
import type { DispatchedEvent } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

const DATA = {
  items: [
    { value: "what", label: "Что это" },
    { value: "how", label: "Как работает" },
  ],
};

export function Events() {
  const [log, setLog] = createSignal<DispatchedEvent[]>([]);

  return (
    <>
      <RenderTree
        tree={instanceOf("accordion", {}, "base", DATA)}
        registry={registry}
        data={DATA}
        dispatch={(event) => setLog([...log(), event])}
      />

      <ul>
        <For each={log()}>
          {(event) => (
            <li>
              {event.name} — {JSON.stringify(event.context)}
            </li>
          )}
        </For>
      </ul>
    </>
  );
}
```

## 🧠 Что запомнить

- **Событие объявляет сборка, а не ты.** В сборке аккордеона на заголовке раздела уже объявлено
  событие с именем и контекстом. Твоё дело — решить, что с ним делать.
- **Имя — из сборки, не из DOM.** Наружу приходит не «клик по такому-то узлу», а осмысленное имя
  события с данными того элемента, на котором оно случилось.
- **`dispatch` необязателен.** Не задал — родные события DOM продолжают работать как обычно, просто
  наружу ничего не уходит.
- **В событии есть адрес узла.** Если на экране десять одинаковых компонентов, отличить, который
  из них сработал, есть по чему.

## 🚫 Чего тут нет

- Изменения дерева в ответ на событие (редактор): движок это умеет, но это уже не «вкатиться», а
  отдельная тема.

## 🎓 Это была последняя ступень

Дальше — [лестница](../../GUIDE.md): ступень 5 (страница целиком, маршруты, состояние, сеть,
формы) и ступень 6 (модули и настройка снаружи). Их ещё нет — если упёрся в то, чего в гайде не
хватило, это заявка, а не повод изобретать обход.
