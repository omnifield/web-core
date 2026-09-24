# 🧪 Примеры — как работать с `DatePicker`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.

Календарь — самый крупный компонент кита: 25 частей. Полную композицию целиком не надо держать в
голове — ниже она собрана один раз, а дальше меняется только то, что относится к сценарию.

## 1. Ручная сборка — одна дата

Самый простой путь: JSX-композиция, без схемы и движка. Строка `control` видна всегда, календарь
всплывает по клику на `trigger`.

```tsx
import {
  DatePicker,
  DatePickerContent,
  DatePickerControl,
  DatePickerInput,
  DatePickerLabel,
  DatePickerNextTrigger,
  DatePickerPositioner,
  DatePickerPrevTrigger,
  DatePickerRangeText,
  DatePickerTable,
  DatePickerTableBody,
  DatePickerTableCell,
  DatePickerTableCellTrigger,
  DatePickerTableHead,
  DatePickerTableHeader,
  DatePickerTableRow,
  DatePickerTrigger,
  DatePickerView,
  DatePickerViewControl,
  DatePickerViewTrigger,
} from "@web-core/ui";

export function BasicDatePickerDemo() {
  return (
    <DatePicker data-variant="xxx">
      <DatePickerLabel>Дата</DatePickerLabel>

      <DatePickerControl>
        <DatePickerInput />
        <DatePickerTrigger>📅</DatePickerTrigger>
      </DatePickerControl>

      <DatePickerPositioner>
        <DatePickerContent>
          <DatePickerView view="day">
            <DatePickerViewControl>
              <DatePickerPrevTrigger>‹</DatePickerPrevTrigger>
              <DatePickerViewTrigger>
                <DatePickerRangeText />
              </DatePickerViewTrigger>
              <DatePickerNextTrigger>›</DatePickerNextTrigger>
            </DatePickerViewControl>

            <DatePickerTable>
              <DatePickerTableHead>
                <DatePickerTableRow>
                  <DatePickerTableHeader>Пн</DatePickerTableHeader>
                  {/* …остальные дни недели */}
                </DatePickerTableRow>
              </DatePickerTableHead>

              <DatePickerTableBody>
                <DatePickerTableRow>
                  <DatePickerTableCell value={someDate}>
                    <DatePickerTableCellTrigger>1</DatePickerTableCellTrigger>
                  </DatePickerTableCell>
                  {/* …остальные дни, по одному настоящему значению даты на ячейку */}
                </DatePickerTableRow>
              </DatePickerTableBody>
            </DatePickerTable>
          </DatePickerView>
        </DatePickerContent>
      </DatePickerPositioner>
    </DatePicker>
  );
}
```

Полезно проверить: ячейка сетки — это ДВА узла, `tableCell` (координата) и `tableCellTrigger`
(кликабельная поверхность со всеми состояниями). Именно на триггере живут `today`, `weekend`,
`selected`, `outside-range` и вся геометрия диапазона — это самая богатая часть кита, двадцать
состояний.

## 2. Диапазон «от — до» и пресет

`selectionMode="range"` ждёт ДВА поля ввода, по одному на `index`. `presetTrigger` прыгает сразу к
именованному диапазону.

```tsx
import {
  DatePicker,
  DatePickerClearTrigger,
  DatePickerContent,
  DatePickerControl,
  DatePickerInput,
  DatePickerLabel,
  DatePickerPositioner,
  DatePickerPresetTrigger,
  DatePickerTrigger,
} from "@web-core/ui";

export function RangeDatePickerDemo() {
  return (
    <DatePicker data-variant="xxx" selectionMode="range">
      <DatePickerLabel>Даты проживания</DatePickerLabel>

      <DatePickerControl>
        <DatePickerInput index={0} />
        <DatePickerInput index={1} />
        <DatePickerTrigger>📅</DatePickerTrigger>
        <DatePickerClearTrigger>✕</DatePickerClearTrigger>
      </DatePickerControl>

      <DatePickerPresetTrigger value="last7Days">Последние 7 дней</DatePickerPresetTrigger>

      <DatePickerPositioner>
        <DatePickerContent>{/* та же сетка дневного вида, что в примере 1 */}</DatePickerContent>
      </DatePickerPositioner>
    </DatePicker>
  );
}
```

Полезно проверить: пока диапазон зафиксирован, ячейки несут `range-start`/`in-range`/`range-end`; а
пока указатель ведёт ко второму клику — `hover-range-start`/`in-hover-range`/`hover-range-end`. Это
разные наборы меток, и в форме скина их обычно красят по-разному: первое — выбор, второе — превью.
`clearTrigger` кит прячет сам, пока ничего не выбрано.

## 3. Несколько отдельных дат

`selectionMode="multiple"`, при желании с потолком по количеству.

```tsx
import {
  DatePicker,
  DatePickerClearTrigger,
  DatePickerContent,
  DatePickerControl,
  DatePickerInput,
  DatePickerLabel,
  DatePickerPositioner,
  DatePickerTrigger,
  DatePickerValueText,
} from "@web-core/ui";

export function MultipleDatePickerDemo() {
  return (
    <DatePicker data-variant="xxx" selectionMode="multiple" maxSelectedDates={3}>
      <DatePickerLabel>Заблокированные даты</DatePickerLabel>

      <DatePickerValueText placeholder="Ничего не выбрано" separator=" · " />

      <DatePickerControl>
        <DatePickerInput />
        <DatePickerTrigger>📅</DatePickerTrigger>
        <DatePickerClearTrigger>✕</DatePickerClearTrigger>
      </DatePickerControl>

      <DatePickerPositioner>
        <DatePickerContent>{/* та же сетка дневного вида */}</DatePickerContent>
      </DatePickerPositioner>
    </DatePicker>
  );
}
```

Полезно проверить: `valueText` форматирует текст сам — плейсхолдер, пока пусто, и разделитель между
датами. Нужна своя разметка на каждую дату (например, крестик «убрать эту дату, не открывая
календарь») — у него есть рендер-проп:

```tsx
<DatePickerValueText>
  {(item) => (
    <span>
      {item.valueAsString}
      <button type="button" onClick={item.remove}>✕</button>
    </span>
  )}
</DatePickerValueText>
```

## 4. Ограничения: диапазон и точечно недоступные даты

`min`/`max` задают жёсткие границы, `isDateUnavailable` выключает отдельные даты внутри них.

```tsx
import { parseDate } from "@ark-ui/solid/date-picker";
import { DatePicker, DatePickerControl, DatePickerInput, DatePickerLabel, DatePickerTrigger } from "@web-core/ui";

export function LimitedDatePickerDemo() {
  return (
    <DatePicker
      data-variant="xxx"
      min={parseDate("2026-09-01")}
      max={parseDate("2026-12-31")}
      isDateUnavailable={(date) => date.toDate("UTC").getDay() % 6 === 0}
    >
      <DatePickerLabel>Дата доставки</DatePickerLabel>
      <DatePickerControl>
        <DatePickerInput />
        <DatePickerTrigger>📅</DatePickerTrigger>
      </DatePickerControl>
      {/* позиционер и сетка — как в примере 1 */}
    </DatePicker>
  );
}
```

Полезно проверить: попавшие под любое из правил ячейки несут `[data-unavailable]`, и кликом их не
выбрать. Единственное место во всех примерах, где импортируется чужое имя, — `parseDate`: `min`/
`max`/`value` ждут настоящее значение даты, а своего способа его создать кит пока не даёт. Это
названный пробел ([`FAQ.md`](./FAQ.md), [`ROADMAP.yaml`](./ROADMAP.yaml)), а не рекомендация ходить
мимо кита: появится свой — поменяется одна строка импорта.

## 5. Календарь прямо в потоке страницы

`inline` снимает поведение попапа целиком: панель никуда не всплывает и видна всегда.

```tsx
import { DatePicker, DatePickerContent, DatePickerPositioner } from "@web-core/ui";

export function InlineDatePickerDemo() {
  return (
    <DatePicker data-variant="xxx" inline>
      <DatePickerPositioner>
        <DatePickerContent>{/* та же сетка дневного вида, всегда видна */}</DatePickerContent>
      </DatePickerPositioner>
    </DatePicker>
  );
}
```

Полезно проверить: на `content` вместо привычной пары `open`/`closed` появляется `[data-inline]` —
если форма скина написана только под `open`, встроенный календарь останется неодетым.

## 6. Виды месяца и года

`viewTrigger` переключает сетку день → месяц → год, `minView`/`maxView` ограничивают глубину.
Переключение вида — это СОСТОЯНИЕ (`data-view`), а не настройка: оно меняется в рантайме, кликом, а
не фиксируется автором в редакторе.

```tsx
import { DatePicker, DatePickerMonthSelect, DatePickerViewControl, DatePickerYearSelect } from "@web-core/ui";

export function ViewsDatePickerDemo() {
  return (
    <DatePicker data-variant="xxx" minView="day" maxView="year">
      {/* …внутри viewControl можно дать прямые прыжки к месяцу и году */}
      <DatePickerViewControl>
        <DatePickerMonthSelect />
        <DatePickerYearSelect />
      </DatePickerViewControl>
      {/* остальная композиция — как в примере 1 */}
    </DatePicker>
  );
}
```

Полезно проверить: `data-view="day|month|year"` появляется сразу на ДЕСЯТИ частях одним атрибутом —
в форме скина это одна ветка на вид, а не десять флагов.

## 7. Рендер через движок — сборка `basic`

Та же композиция, но собранная по схеме и нарисованная `RenderTree`: открытый календарь с одной
настоящей неделей (24–30 августа 2026), 25-е выбрано, 27-е — сегодня.

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineDatePickerDemo() {
  const data = { label: "Дата" };

  return (
    <RenderTree
      tree={instanceOf("date-picker", { "data-variant": "xxx" }, "basic", data)}
      registry={registry}
      data={data}
    />
  );
}
```

Полезно проверить: из данных приезжает ТОЛЬКО подпись — дни недели, сама неделя и иконки навигации
в этой сборке структурные. Причина названа честно: ячейке нужен настоящий объект даты, а JSON-схема
io его не производит; собрать весь календарь из данных сегодня нечем. При этом `today`/`selected`/
`weekend` считает настоящая машина по настоящим датам, а не проставлены руками в сборке.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: сетка, подсветка сегодняшнего дня, заливка диапазона и
превью наведения приезжают формой скина. Смотреть живьём — на dev-сервере приложения, где кит
подключён вместе со скином.

Две детали для авторов форм. Первая: высоту панели ограничивает `positioner`, а прокручивает себя
сам `content` — сделаете иначе, прокрутка появится у всей страницы. Вторая: программного доступа к
машине (перейти к сегодняшней дате кнопкой снаружи, узнать текущий вид) кит наружу не даёт вовсе —
названный пробел, см. [`ROADMAP.yaml`](./ROADMAP.yaml). Полный рабочий прогон —
`test/date-picker.test.tsx`.
