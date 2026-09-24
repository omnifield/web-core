# 10. Нужен именно такой вид — выбор сборки

**Показываем:** одни и те же данные, показанные семью видами графика. Меняется одно слово.
**Зачем:** это и есть ответ на вопрос «как сказать, что мне нужен вот ТАКОЙ компонент».

## 💻 Код

```tsx
import { createSignal, For } from "@web-core/solid";
import { RenderTree } from "@web-core/assembly/render";
import { Button } from "@web-core/ui";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

const KINDS = ["line", "area", "bar", "bar-horizontal", "point", "pie", "donut"];

const DATA = {
  data: [
    { month: "янв", revenue: 120 },
    { month: "фев", revenue: 180 },
    { month: "мар", revenue: 140 },
  ],
  series: [{ x: "month", y: "revenue", label: "Выручка" }],
};

export function ComponentKind() {
  const [kind, setKind] = createSignal("line");

  return (
    <>
      <For each={KINDS}>
        {(name) => <Button onClick={() => setKind(name)}>{name}</Button>}
      </For>

      <RenderTree
        tree={instanceOf("diagram", {}, kind(), DATA)}
        registry={registry}
        data={DATA}
      />
    </>
  );
}
```

Третий аргумент `instanceOf` — **имя сборки**. Это и есть «какой вид компонента мне нужен».

## 🧠 Что запомнить

- **Сборка отвечает на вопрос «чем эта вещь является».** Столбцы и кольцо рисуются разными частями
  и по разной математике — это разные сборки, а не настройка одной.
- **Вариант (кейс 6) отвечает на другой вопрос — «как она выглядит».** Цвет, толщина, скругление —
  это вид, он живёт в форме наряда. Граница простая: меняется, ЧЕМ нарисовано → сборка; меняется,
  КАК покрашено → вариант.
- **Имя не названо — берётся первая объявленная сборка.** Для графика это `line`.
- **Список сборок у компонента конечный и объявлен им самим.** Его можно прочитать у компонента;
  выдумать имя на месте нельзя — такой сборки просто нет.

## 🚫 Чего тут нет

- Разбора, как устроены сами данные графика: серии и оси — следующий кейс.

→ Дальше: [`data`](../data/README.md)
