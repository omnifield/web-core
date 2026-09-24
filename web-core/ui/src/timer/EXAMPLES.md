# 🧪 Примеры — как работать с `Timer`

Рабочий код для локального теста, не канон. Анатомия, состояния и зацепки для стилей —
[`README.md`](./README.md). Здесь — то, что можно скопировать и сразу погонять.

> [!IMPORTANT]
> **Вид ставится атрибутом `data-variant` на корень — это основной вход стилизации.** Кит по
> умолчанию не несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида
> придумывает не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит
> `data-variant="xxx"`, подставьте имя своей формы (те же имена показывает витрина в карточке
> компонента).

> [!NOTE]
> У компонента нет своих `FAQ.md`/`ROADMAP.yaml` — разборы и план по нему живут в доке зоны
> (`web-core/ui/FAQ.md`, `web-core/ui/ROADMAP.yaml`).

## 1. Секундомер — считает вверх

Самый простой путь: JSX-композиция, без схемы и движка. Единицы времени выбирает потребитель:
сколько `item` положили, столько и показывается.

```tsx
import {
  Timer,
  TimerActionTrigger,
  TimerArea,
  TimerControl,
  TimerItem,
  TimerSeparator,
} from "@web-core/ui";

export function StopwatchTimerDemo() {
  return (
    <Timer data-variant="xxx">
      <TimerArea>
        <TimerItem type="minutes" />
        <TimerSeparator>:</TimerSeparator>
        <TimerItem type="seconds" />
      </TimerArea>

      <TimerControl>
        <TimerActionTrigger action="start">Пуск</TimerActionTrigger>
        <TimerActionTrigger action="pause">Пауза</TimerActionTrigger>
        <TimerActionTrigger action="resume">Продолжить</TimerActionTrigger>
        <TimerActionTrigger action="reset">Сброс</TimerActionTrigger>
      </TimerControl>
    </Timer>
  );
}
```

Полезно проверить: кнопки прячутся сами — до старта нет «паузы», на ходу нет «продолжить». Кит
делает это нативным `hidden`, а не меткой состояния: отдельного `data-*` под «идёт/на паузе» не
существует нигде в компоненте. `TimerItem` самозаполняющийся — детей он не принимает, текст рисует
сам.

## 2. Обратный отсчёт

`countdown` меняет направление, `startMs` задаёт, с чего начать.

```tsx
import { Timer, TimerActionTrigger, TimerArea, TimerControl, TimerItem, TimerSeparator } from "@web-core/ui";

export function CountdownTimerDemo() {
  return (
    <Timer data-variant="xxx" countdown startMs={5 * 60 * 1000} onComplete={() => console.log("время вышло")}>
      <TimerArea>
        <TimerItem type="minutes" />
        <TimerSeparator>:</TimerSeparator>
        <TimerItem type="seconds" />
      </TimerArea>

      <TimerControl>
        <TimerActionTrigger action="start">Пуск</TimerActionTrigger>
        <TimerActionTrigger action="pause">Пауза</TimerActionTrigger>
        <TimerActionTrigger action="reset">Сброс</TimerActionTrigger>
      </TimerControl>
    </Timer>
  );
}
```

Полезно проверить: `onComplete` срабатывает один раз, когда таймер дошёл до цели. В режиме отсчёта
вниз `targetMs` — это пол, ниже которого он не опускается.

## 3. Доли секунды — свой шаг тика

`interval` (по умолчанию `1000` мс) решает, как часто пересчитывается значение. Показывать
миллисекунды с секундным шагом бессмысленно — шаг уменьшают вместе с единицей.

```tsx
import { Timer, TimerActionTrigger, TimerArea, TimerControl, TimerItem, TimerSeparator } from "@web-core/ui";

export function FastTimerDemo() {
  return (
    <Timer data-variant="xxx" interval={100} targetMs={60 * 1000}>
      <TimerArea>
        <TimerItem type="seconds" />
        <TimerSeparator>.</TimerSeparator>
        <TimerItem type="milliseconds" />
      </TimerArea>

      <TimerControl>
        <TimerActionTrigger action="start">Пуск</TimerActionTrigger>
        <TimerActionTrigger action="reset">Сброс</TimerActionTrigger>
      </TimerControl>
    </Timer>
  );
}
```

Полезно проверить: у каждой единицы стоит свой `[data-type]` (`"seconds"`, `"milliseconds"` и так
далее) — один общий атрибут с пятью значениями, по нему форма и различает единицы. Рядом на `item`
лежит `--value` — СЫРОЕ число (`5`, а не `"05"`), если форме нужно считать, а не разбирать строку.

## 4. Подпись у единицы — свои части

`itemValue` и `itemLabel` разбивают единицу на число и подпись: вместо «05:30» получается «05 мин
30 сек». Обе части настоящие, кит написал их сам поверх того же контекста, что читают остальные.

```tsx
import { Timer, TimerArea, TimerItemLabel, TimerItemValue } from "@web-core/ui";

export function LabeledTimerDemo() {
  return (
    <Timer data-variant="xxx" countdown startMs={90 * 1000}>
      <TimerArea>
        <TimerItemValue type="minutes" />
        <TimerItemLabel type="minutes">мин</TimerItemLabel>

        <TimerItemValue type="seconds" />
        <TimerItemLabel type="seconds">сек</TimerItemLabel>
      </TimerArea>
    </Timer>
  );
}
```

Полезно проверить: подпись — содержимое потребителя, кит слов «мин»/«сек» не знает и не переводит.
Обе части несут тот же `[data-type]`, что и `item`, поэтому форма красит их одним правилом.

## 5. Наблюдать за ходом снаружи

`onTick` срабатывает на каждом обновлении — им удобно двигать что-то за пределами самого таймера
(прогресс-полосу, автосохранение).

```tsx
import { createSignal } from "@web-core/solid";
import { Timer, TimerActionTrigger, TimerArea, TimerControl, TimerItem } from "@web-core/ui";

export function ObservedTimerDemo() {
  const [ticks, setTicks] = createSignal(0);

  return (
    <>
      <Timer
        data-variant="xxx"
        targetMs={60 * 1000}
        onTick={() => setTicks((value) => value + 1)}
        onComplete={() => console.log("готово")}
      >
        <TimerArea>
          <TimerItem type="seconds" />
        </TimerArea>

        <TimerControl>
          <TimerActionTrigger action="start">Пуск</TimerActionTrigger>
          <TimerActionTrigger action="reset">Сброс</TimerActionTrigger>
        </TimerControl>
      </Timer>

      <p>тиков: {ticks()}</p>
    </>
  );
}
```

Полезно проверить: «идёт» или «на паузе» из разметки НЕ узнать — этого следа компонент не
оставляет. Единственный внешний признак хода — какие кнопки кит спрятал; если вид «работающего»
таймера нужен, ведите это состояние у себя, а не ищите метку.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: моноширинные цифры, размер, разрядка и вид кнопок
приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со
скином.

Четыре части из восьми (`root`, `area`, `control`, `separator`) не несут вообще никаких меток — это
голые обёртки, и правило для них пишется просто на адрес части. Доступность при этом бесплатна:
`area` рисуется с `role="timer"`, и экранный читатель объявляет изменения сам, без живой области от
потребителя.
