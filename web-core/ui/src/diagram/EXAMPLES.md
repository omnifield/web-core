# 🧪 Примеры — как работать с `Diagram`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

> [!IMPORTANT]
> **Вид приезжает атрибутом `data-variant` — это основной вход стилизации.** Кит по умолчанию не
> несёт ни одного стиля: компонент без вида выглядит голым, и это не поломка. Имя вида придумывает
> не кит, а форма скина — запись в службе; поэтому в примерах ниже стоит `data-variant="xxx"`,
> подставьте имя своей формы (те же имена показывает витрина в карточке компонента). Атрибут
> ставится на КОРЕНЬ компонента, и по нему же компонент просит у скина ровно этот кусок CSS.
>
> Отдельно от вида: **цвет серий приходит в ДАННЫХ**, а не из формы. Форма красит серии фолбэком —
> он виден ровно до тех пор, пока цвет не пришёл в данных (пришедший встаёт инлайном и побеждает
> правило по специфичности).

## 1. Минимальный график

Корню хватает данных и описания серии: вид шкалы, границы, оси и сетку он считает сам.

```tsx
import { DiagramRoot } from "@web-core/ui";

const rows = [
  { day: 0, temperature: 12 },
  { day: 1, temperature: 15 },
  { day: 2, temperature: 14 },
];

export function BasicDiagramDemo() {
  return <DiagramRoot data-variant="xxx" data={rows} series={[{ x: "day", y: "temperature" }]} />;
}
```

Полезно проверить: `x`/`y` — это ИМЕНА ПОЛЕЙ строки, а не функции-аксессоры. Строку можно положить
в пресет, передать по сети и открыть в редакторе, функцию — нет; отсюда всё устройство io-схемы.
Размер задавать не нужно: без `width`/`height` корень меряет свой реальный размер на экране и
строит систему координат ровно по нему — высоту и ширину решает форма скина.

## 2. Одни данные — любой вид

Форма НЕ живёт в данных. Те же строки и то же описание серий показываются любым видом: меняется
один проп, а в схемной сборке — её имя.

```tsx
import { DiagramRoot } from "@web-core/ui";

const rows = [
  { quarter: "Q1", revenue: 120 },
  { quarter: "Q2", revenue: 190 },
  { quarter: "Q3", revenue: 160 },
];
const series = [{ x: "quarter", y: "revenue" }];

export function ShapesDiagramDemo() {
  return (
    <>
      <DiagramRoot data-variant="xxx" data={rows} series={series} shape="line" />
      <DiagramRoot data-variant="xxx" data={rows} series={series} shape="area" />
      <DiagramRoot data-variant="xxx" data={rows} series={series} shape="bar" />
      <DiagramRoot data-variant="xxx" data={rows} series={series} shape="bar-horizontal" />
      <DiagramRoot data-variant="xxx" data={rows} series={series} shape="point" />
      <DiagramRoot data-variant="xxx" data={rows} series={series} shape="pie" />
      <DiagramRoot data-variant="xxx" data={rows} series={series} shape="pie" innerRatio={0.6} />
    </>
  );
}
```

Полезно проверить: под `bar` корень сам берёт КАТЕГОРИАЛЬНУЮ шкалу по горизонтали и подписывает её
делениями из домена; под остальные — непрерывную по типу значений. У `pie` координатной системы нет
вовсе: ни осей, ни сетки, вместо диапазонов шкал корень считает центр и радиус. Комбинированный вид
(столбцы плюс линия поверх) одним пропом не выражается — это отдельная механика слоёв, её ещё нет.

## 3. Несколько серий и цвет из данных

Несколько описаний серий — несколько линий одной формы. Цвет — часть данных: `color` красит всю
серию, `colorField` называет поле, в котором лежит цвет ОТДЕЛЬНОЙ точки (и он сильнее).

```tsx
import { DiagramRoot } from "@web-core/ui";

const rows = [
  { day: 0, temperature: 12, humidity: 70, tone: "var(--accent-9)" },
  { day: 1, temperature: 15, humidity: 65, tone: "var(--warning-9)" },
  { day: 2, temperature: 14, humidity: 72, tone: "var(--success-9)" },
];

export function SeriesColorDiagramDemo() {
  return (
    <>
      <DiagramRoot
        data-variant="xxx"
        data={rows}
        series={[
          { x: "day", y: "temperature", label: "Температура", color: "var(--accent-9)" },
          { x: "day", y: "humidity", label: "Влажность", color: "var(--success-9)" },
        ]}
      />

      <DiagramRoot
        data-variant="xxx"
        data={rows}
        series={[{ x: "day", y: "temperature", colorField: "tone" }]}
        shape="bar"
      />
    </>
  );
}
```

Полезно проверить: в данных лежит ГОТОВОЕ CSS-значение (`"var(--accent-9)"`), а не имя категории
палитры — иначе компоненту пришлось бы самому дописывать ступень, то есть решать за автора палитры.
Уберите цвет из данных — инлайна не будет вовсе, и серию покрасит форма скина. Одноцветный график —
законное состояние «данные про цвет ничего не сказали», а не поломка.

## 4. Уточнить оси и поле под подписи

Оси выводятся из серий сами. Явное описание их УТОЧНЯЕТ: подпись, число делений, вид шкалы, свои
границы, `hidden` (не рисовать ось, но оставить сетку по ней).

```tsx
import { DiagramRoot } from "@web-core/ui";

const rows = [
  { day: 0, temperature: 12 },
  { day: 1, temperature: 15 },
];

export function AxesDiagramDemo() {
  return (
    <DiagramRoot
      data-variant="xxx"
      data={rows}
      series={[{ x: "day", y: "temperature" }]}
      axes={[{ orientation: "y", ticks: 3, domain: [0, 30], label: "°C" }]}
      insets={{ left: 64 }}
    />
  );
}
```

Полезно проверить: у оси и сетки появляется `[data-orientation="x"|"y"]` — единственное состояние,
которое диаграмма сегодня несёт вообще (у серий состояний нет: наведение и подсветка приедут вместе
с подсказкой). `insets` трогают только когда подписи перестали помещаться: у поля есть разумный
дефолт (`{ top: 12, right: 12, bottom: 28, left: 44 }`).

## 5. Рукописный путь — свои слои поверх посчитанного

Нужен полный контроль (свой порядок слоёв, своя форма точки, чужой компонент внутри графика) —
корень отдаёт посчитанный фрейм рендер-пропом: обе шкалы, геометрию области построения, выведенные
оси. Тем же приёмом таблица отдаёт наружу свой инстанс движка.

```tsx
import {
  DiagramAxis,
  DiagramGrid,
  DiagramLine,
  DiagramRoot,
  isBandScale,
} from "@web-core/ui";

const rows = [
  { day: 0, temperature: 12 },
  { day: 1, temperature: 15 },
  { day: 2, temperature: 14 },
];

export function HandwrittenDiagramDemo() {
  return (
    <DiagramRoot data-variant="xxx" width={360} height={240} data={rows} series={[{ x: "day", y: "temperature" }]}>
      {(frame) =>
        isBandScale(frame.xScale) ? undefined : (
          <>
            <DiagramGrid scale={frame.yScale} orientation="y" from={frame.plot.left} to={frame.plot.right} />
            <DiagramLine
              data={rows}
              xScale={frame.xScale}
              yScale={frame.yScale}
              x={(row) => row.day}
              y={(row) => row.temperature}
            />
            <DiagramAxis scale={frame.xScale} orientation="x" offset={frame.plot.bottom} />
          </>
        )
      }
    </DiagramRoot>
  );
}
```

Полезно проверить: `from`/`to` у сетки — края диапазона ДРУГОЙ, перпендикулярной шкалы:
вертикальные линии тянутся по всей высоте, и наоборот. Явные `width`/`height` здесь уместны:
рукописному случаю часто нужна фиксированная система координат.

> [!WARNING]
> `isBandScale` (сужение типа шкалы), `place` и `ticksOf` объявлены в компоненте, но НАРУЖУ пакета
> сегодня не выходят: барель компонента (`src/diagram/index.ts`) перечисляет только сами
> `Diagram*`-части, и в типах поставки (`dist/index.d.ts`) этих имён нет. Значит пример выше пока
> собирается только ВНУТРИ кита — снаружи сузить тип шкалы нечем. Это расхождение бареля с кодом,
> а не намеренная граница; до его закрытия рукописный путь снаружи доступен ровно настолько,
> насколько обходится без этих трёх имён.

## 6. Рендер через движок — семь сборок

Дерево у всех сборок одно и то же — единственный узел `root` с тем же `bind`. Отличаются они ровно
одним пропом `shape`, поэтому переключатель сборки работает как переключатель вида графика.

```tsx
import { For } from "@web-core/solid";
import { RenderTree } from "@web-core/assembly/render";
import { kitComponentRenderer } from "@web-core/ui/component-registry";

const { registry, instanceOf } = kitComponentRenderer();

export function EngineDiagramDemo() {
  const data = {
    data: [
      { quarter: "Q1", revenue: 120 },
      { quarter: "Q2", revenue: 190 },
    ],
    series: [{ x: "quarter", y: "revenue", label: "Выручка", color: "var(--accent-9)" }],
  };

  return (
    <For each={["line", "area", "bar", "bar-horizontal", "point", "pie", "donut"]}>
      {(assembly) => (
        <RenderTree
          tree={instanceOf("diagram", { "data-variant": "xxx" }, assembly, data)}
          registry={registry}
          data={data}
        />
      )}
    </For>
  );
}
```

Полезно проверить: `data` в io-схеме — открытый мешок строк, компонент не знает и не проверяет,
какие у строки поля; `series` — тоже данные, а не код (имена полей, подпись, цвет). Выхода у
диаграммы сегодня нет вовсе: ни выбора, ни наведения наружу она не отдаёт — `dispatch` ей не нужен.

## Посмотреть живьём

Кит по умолчанию не несёт ни одного стиля: приглушённые подписи осей, едва заметная сетка,
полупрозрачная заливка области приезжают формой скина. Смотреть живьём — на dev-сервере приложения,
где кит подключён вместе со скином.

Две грабли, уже пойманные живьём и стоящие того, чтобы не наступать заново. Первая: не задавайте
графику размер пропами, если форма растягивает сам `<svg>` — браузер впишет фиксированную систему
координат в другой бокс, и график будет выглядеть сжатым с полями по краям. Вторая: в своей форме
не разделяйте сектора пирога обводкой цветом фона — проверка скина считает `stroke` краской и
требует контрастную ступень палитры; разделяйте геометрией или цветом самих долей. Полный рабочий
прогон — `test/diagram.test.tsx`.
