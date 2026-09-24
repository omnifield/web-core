# 🧪 Примеры — как работать с `Slider`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

## 1. Ручная сборка — один бегунок

Самый простой путь: JSX-композиция, без схемы и движка. Скрытый `<input>` кладётся РУКАМИ внутрь
бегунка — в отличие от чекбокса и переключателя, слайдер его сам не подставляет: у диапазона
полей может понадобиться два, с разными именами, и это решение оставлено тому, кто собирает форму.

```tsx
import {
  Slider,
  SliderControl,
  SliderHiddenInput,
  SliderLabel,
  SliderRange,
  SliderThumb,
  SliderTrack,
} from "@web-core/ui";

export function BasicSliderDemo() {
  return (
    <Slider data-variant="xxx" defaultValue={[40]}>
      <SliderLabel>Громкость</SliderLabel>
      <SliderControl>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb index={0}>
          <SliderHiddenInput />
        </SliderThumb>
      </SliderControl>
    </Slider>
  );
}
```

Полезно проверить: бегунок — настоящий фокусируемый узел (`role="slider"` со своим
`aria-valuenow`), стрелки меняют значение на `step`, `Home`/`End` бросают его в минимум и максимум.
Клик по дорожке в любом месте двигает ближайший бегунок — за это отвечает `control`, а не сам
`track`.

## 2. Живой текст значения

`SliderValueText` не форматирует ничего сам. Нужен живой текст — держите значение управляемым и
отдавайте готовую строку.

```tsx
import { createSignal } from "@web-core/solid";
import {
  Slider,
  SliderControl,
  SliderHiddenInput,
  SliderLabel,
  SliderRange,
  SliderThumb,
  SliderTrack,
  SliderValueText,
} from "@web-core/ui";

export function ValueTextSliderDemo() {
  const [value, setValue] = createSignal([40]);

  return (
    <Slider
      data-variant="xxx"
      value={value()}
      onValueChange={(details) => setValue(details.value)}
    >
      <SliderLabel>Громкость</SliderLabel>
      <SliderValueText>{value().join(" – ")} %</SliderValueText>
      <SliderControl>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb index={0}>
          <SliderHiddenInput />
        </SliderThumb>
      </SliderControl>
    </Slider>
  );
}
```

Полезно проверить: `onValueChange` отдаёт `details.value` МАССИВОМ всегда — и для одного бегунка
тоже (там это массив из одного числа). Во время перетаскивания на `root`/`label`/`track`/`range`/
`control` висит `[data-dragging]`, а на самом бегунке — только пока тянут ИМЕННО его.

## 3. Диапазон «от — до»

Два значения — два бегунка, у каждого свой `index`, своё фокусирование и своё скрытое поле формы.

```tsx
import {
  Slider,
  SliderControl,
  SliderHiddenInput,
  SliderLabel,
  SliderRange,
  SliderThumb,
  SliderTrack,
} from "@web-core/ui";

export function RangeSliderDemo() {
  return (
    <Slider data-variant="xxx" defaultValue={[30, 60]} minStepsBetweenThumbs={1}>
      <SliderLabel>Цена</SliderLabel>
      <SliderControl>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb index={0}>
          <SliderHiddenInput name="priceFrom" />
        </SliderThumb>
        <SliderThumb index={1}>
          <SliderHiddenInput name="priceTo" />
        </SliderThumb>
      </SliderControl>
    </Slider>
  );
}
```

Полезно проверить: у каждого бегунка своё `aria-valuenow`, закрашенная часть (`range`) идёт МЕЖДУ
ними, а не от нуля. `minStepsBetweenThumbs` не даёт им схлопнуться в одну точку.

## 4. Деления шкалы и подсказка при перетаскивании

Обе части необязательные — слайдер работает и без них. Деление знает своё положение относительно
текущего значения, независимо от того, тянут ли что-то прямо сейчас.

```tsx
import { For } from "@web-core/solid";
import {
  Slider,
  SliderControl,
  SliderDraggingIndicator,
  SliderHiddenInput,
  SliderMarker,
  SliderMarkerGroup,
  SliderRange,
  SliderThumb,
  SliderTrack,
} from "@web-core/ui";

export function MarkersSliderDemo() {
  return (
    <Slider data-variant="xxx" defaultValue={[50]}>
      <SliderControl>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>

        <SliderThumb index={0}>
          <SliderDraggingIndicator>тяну</SliderDraggingIndicator>
          <SliderHiddenInput />
        </SliderThumb>

        <SliderMarkerGroup>
          <For each={[0, 25, 50, 75, 100]}>
            {(value) => <SliderMarker value={value}>{value}</SliderMarker>}
          </For>
        </SliderMarkerGroup>
      </SliderControl>
    </Slider>
  );
}
```

Полезно проверить: деления ниже текущего значения помечены `[data-state="under-value"]`, ровно на
нём — `at-value`, выше — `over-value`; подсказка получает `[data-state="open"]` только пока бегунок
тянут. Группа делений декоративная — в дерево доступности она не попадает.

## 5. Вертикальный, свой диапазон и шаг

`orientation` — настоящая настройка паспорта: меняет не только ось, но и то, какие стрелки
увеличивают значение.

```tsx
import { Slider, SliderControl, SliderHiddenInput, SliderRange, SliderThumb, SliderTrack } from "@web-core/ui";

export function VerticalSliderDemo() {
  return (
    <Slider
      data-variant="xxx"
      orientation="vertical"
      min={-10}
      max={10}
      step={0.5}
      defaultValue={[5]}
    >
      <SliderControl>
        <SliderTrack>
          <SliderRange />
        </SliderTrack>
        <SliderThumb index={0}>
          <SliderHiddenInput />
        </SliderThumb>
      </SliderControl>
    </Slider>
  );
}
```

Полезно проверить: значение шагает по `0.5`, не по единице, и не выходит за `min`/`max` — это
считает сам слайдер. На корне появляется `data-orientation="vertical"`.

## 6. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`. Подпись и стартовое значение
приезжают из данных (`/label`, `/defaultValue` по io-схеме).

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineSliderDemo() {
  const data = { label: "Громкость", defaultValue: [40] };

  return (
    <RenderTree
      tree={instanceOf("slider", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: перетаскивание и клавиатура работают по-настоящему, а вот текст значения в этой
сборке — СНИМОК стартового числа и при движении бегунка не меняется. Это не баг сборки: статичное
дерево не умеет выразить «читай внутреннее состояние компонента», поэтому живой текст делается
ручной композицией (пример 2). Событий наружу схемы слайдер не отдаёт — `dispatch` ему не нужен.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: дорожка, закраска, размер бегунка и его тень приезжают
формой скина. Смотреть живьём — на dev-сервере приложения, где кит подключён вместе со скином.

Одна деталь для авторов форм: позицию бегунка, конец закраски и место деления слайдер считает и
выставляет инлайном сам — рецепту остаётся только вид поверх готовой позиции. Исключение —
собственный размер бегунка: его слайдер ИЗМЕРЯЕТ, поэтому форма обязана дать настоящие ширину и
высоту, а не ссылку на переменную. Полный рабочий прогон — `test/slider.test.tsx`.
