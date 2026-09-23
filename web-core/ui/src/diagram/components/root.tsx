import { scaleBand, scaleLinear, scaleLog, scaleTime } from "d3-scale";
import { createMemo, createSignal, onCleanup, splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";
import { anatomyParts } from "../entity/anatomy.js";
import type {
  DiagramAxisSpec,
  DiagramInsets,
  DiagramRow,
  DiagramScaleKind,
  DiagramSeriesSpec,
} from "../entity/io.js";
import type { DiagramAxisOrientation, DiagramScale } from "./cartesian/axis.js";
import { DefaultDiagramBody } from "./default-body.js";

/** Форма графика — она ЖЕ решает, какой частью рисуется серия. Приходит пропом (сборкой), не
 * данными: одни и те же строки должны показываться любым видом (`FAQ.md`). */
export type DiagramShape = "line" | "area" | "bar" | "bar-horizontal" | "point" | "pie";

/** Радиальные формы живут в полярных координатах — осей и сетки у них нет вовсе. */
export function isRadial(shape: DiagramShape): boolean {
  return shape === "pie";
}

/** Формы, у которых категории идут по вертикали, а значения по горизонтали. */
function isFlipped(shape: DiagramShape): boolean {
  return shape === "bar-horizontal";
}

const DEFAULT_SHAPE: DiagramShape = "line";
/** Запасной размер системы координат — пока ничего не измерено (первый кадр, среда без раскладки). */
const DEFAULT_WIDTH = 360;
const DEFAULT_HEIGHT = 240;
const DEFAULT_INSETS: Required<DiagramInsets> = { top: 12, right: 12, bottom: 28, left: 44 };
const BAND_PADDING = 0.2;

/** Пиксельные края области построения — внутри них живут шкалы, снаружи стоят подписи. */
export interface DiagramPlot {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

export interface DiagramAxisView {
  readonly orientation: DiagramAxisOrientation;
  readonly scale: DiagramScale;
  readonly offset: number;
  readonly ticks?: number;
  readonly label?: string;
  readonly hidden?: boolean;
}

/** Центр и радиус круга — геометрия радиальных форм, у декартовых не используется. */
export interface DiagramDisc {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

/** Всё, что корень посчитал по данным: геометрия, шкалы, выведенные оси. */
export interface DiagramFrame {
  readonly shape: DiagramShape;
  readonly width: number;
  readonly height: number;
  readonly insets: Required<DiagramInsets>;
  readonly plot: DiagramPlot;
  readonly disc: DiagramDisc;
  readonly data: readonly DiagramRow[];
  readonly series: readonly DiagramSeriesSpec[];
  readonly xScale: DiagramScale;
  readonly yScale: DiagramScale;
  readonly axes: readonly DiagramAxisView[];
}

function valuesOf(data: readonly DiagramRow[], field: string): readonly unknown[] {
  return data.map((row) => row[field]).filter((value) => value !== undefined && value !== null);
}

function numbersOf(values: readonly unknown[]): readonly number[] {
  return values.map((value) => (value instanceof Date ? value.getTime() : Number(value))).filter(Number.isFinite);
}

function inferScaleKind(
  values: readonly unknown[],
  orientation: DiagramAxisOrientation,
  shape: DiagramShape,
): DiagramScaleKind {
  if (shape === "bar" && orientation === "x") return "band";
  if (shape === "bar-horizontal") return orientation === "y" ? "band" : "linear";

  const sample = values[0];
  if (sample instanceof Date) return "time";
  if (typeof sample === "number") return "linear";
  if (typeof sample === "string" && sample.trim() !== "" && Number.isFinite(Number(sample))) return "linear";

  return values.length === 0 ? "linear" : "band";
}

function extentOf(values: readonly number[], zeroBased: boolean): readonly [number, number] {
  if (values.length === 0) return [0, 1];

  const low = Math.min(...values, zeroBased ? 0 : Number.POSITIVE_INFINITY);
  const high = Math.max(...values, zeroBased ? 0 : Number.NEGATIVE_INFINITY);

  return low === high ? [low, low + 1] : [low, high];
}

function uniqueStrings(values: readonly unknown[]): readonly string[] {
  return [...new Set(values.map((value) => String(value)))];
}

function buildScale(
  kind: DiagramScaleKind,
  values: readonly unknown[],
  range: readonly [number, number],
  zeroBased: boolean,
  domain?: readonly [number, number],
): DiagramScale {
  if (kind === "band") {
    return scaleBand<string>().domain(uniqueStrings(values)).range([range[0], range[1]]).padding(BAND_PADDING);
  }

  const numbers = numbersOf(values);
  const span = domain ?? extentOf(numbers, zeroBased);

  if (kind === "time") {
    return scaleTime().domain([new Date(span[0]), new Date(span[1])]).range([range[0], range[1]]);
  }

  if (kind === "log") {
    const low = span[0] > 0 ? span[0] : 1;
    return scaleLog().domain([low, Math.max(span[1], low * 10)]).range([range[0], range[1]]);
  }

  return scaleLinear().domain([span[0], span[1]]).range([range[0], range[1]]);
}

/** Какое поле серии читает ЭКРАННАЯ ось. У горизонтальных столбцов категория уезжает на
 * вертикаль, значение на горизонталь — поля меняются местами, описание серии не трогается. */
function fieldsOf(
  series: readonly DiagramSeriesSpec[],
  orientation: DiagramAxisOrientation,
  shape: DiagramShape,
): readonly string[] {
  const own = isFlipped(shape) ? orientation === "y" : orientation === "x";
  return [...new Set(series.map((entry) => (own ? entry.x : entry.y)))];
}

function discOf(plot: DiagramPlot): DiagramDisc {
  return {
    cx: (plot.left + plot.right) / 2,
    cy: (plot.top + plot.bottom) / 2,
    radius: Math.max(Math.min(plot.right - plot.left, plot.bottom - plot.top) / 2, 0),
  };
}

function rangeFor(
  plot: DiagramPlot,
  orientation: DiagramAxisOrientation,
  kind: DiagramScaleKind,
): readonly [number, number] {
  if (orientation === "x") return [plot.left, plot.right];

  // Значения по вертикали растут вверх (диапазон перевёрнут), категории читаются сверху вниз.
  return kind === "band" ? [plot.top, plot.bottom] : [plot.bottom, plot.top];
}

function scaleFor(
  data: readonly DiagramRow[],
  series: readonly DiagramSeriesSpec[],
  shape: DiagramShape,
  orientation: DiagramAxisOrientation,
  plot: DiagramPlot,
  spec: DiagramAxisSpec | undefined,
): DiagramScale {
  const values = fieldsOf(series, orientation, shape).flatMap((field) => valuesOf(data, field));
  const kind = spec?.scale ?? inferScaleKind(values, orientation, shape);

  // Ось значений считается от нуля — иначе столбец начинается не от базовой линии, а от минимума.
  const valueAxis = isFlipped(shape) ? orientation === "x" : orientation === "y";

  return buildScale(kind, values, rangeFor(plot, orientation, kind), valueAxis, spec?.domain);
}

function axisViews(
  specs: readonly DiagramAxisSpec[],
  xScale: DiagramScale,
  yScale: DiagramScale,
  plot: DiagramPlot,
): readonly DiagramAxisView[] {
  return (["x", "y"] as const).map((orientation) => {
    const spec = specs.find((entry) => entry.orientation === orientation);

    return {
      orientation,
      scale: orientation === "x" ? xScale : yScale,
      offset: orientation === "x" ? plot.bottom : plot.left,
      ticks: spec?.ticks,
      label: spec?.label,
      hidden: spec?.hidden,
    };
  });
}

export type DiagramRootProps = Omit<
  JSX.SvgSVGAttributes<SVGSVGElement>,
  "width" | "height" | "children"
> & {
  /** Размер системы координат. Не задан — корень берёт свой реальный размер на экране, а
   * задавать его остаётся делом рецепта (`inlineSize`/`blockSize`), не сборки. */
  width?: number;
  height?: number;
  data?: readonly DiagramRow[];
  /** Что показывать: поля, подпись, цвет (`entity/io.ts`). Форму задаёт `shape`, не данные. */
  series?: readonly DiagramSeriesSpec[];
  /** Чем рисуются серии — по умолчанию линия. Одна на весь график: комбинированный вид
   * (столбцы и линия разом) — отдельный пункт `ROADMAP.yaml`, не этот проп. */
  shape?: DiagramShape;
  /** Уточнение выведенных осей; не задано — оси выводятся из серий. */
  axes?: readonly DiagramAxisSpec[];
  insets?: DiagramInsets;
  /** Фоновая сетка стандартной структуры; на рукописный путь не влияет. */
  grid?: boolean;
  /** Дырка в центре круговой формы: 0 — пирог, доля радиуса — бублик. */
  innerRatio?: number;
  /** Функция — рукописный путь с готовым фреймом; готовое поддерево — превьюер сборки. */
  children?: JSX.Element | ((frame: DiagramFrame) => JSX.Element);
};

export function DiagramRoot(props: DiagramRootProps) {
  useKitLife(passport, props);

  const [local, rest] = splitProps(props, [
    "width",
    "height",
    "data",
    "series",
    "shape",
    "axes",
    "insets",
    "grid",
    "innerRatio",
    "children",
  ]);

  const [measured, setMeasured] = createSignal<{ width: number; height: number }>();

  // Система координат равна реальному размеру на экране — иначе viewBox вписывает рисунок
  // в бокс с полями, и график выглядит сжатым (`FAQ.md`).
  const observe = (node: SVGSVGElement): void => {
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;
      if (box && box.width > 0 && box.height > 0) setMeasured({ width: box.width, height: box.height });
    });

    observer.observe(node);
    onCleanup(() => observer.disconnect());
  };

  const width = () => local.width ?? measured()?.width ?? DEFAULT_WIDTH;
  const height = () => local.height ?? measured()?.height ?? DEFAULT_HEIGHT;

  const frame = createMemo<DiagramFrame>(() => {
    const data = local.data ?? [];
    const series = local.series ?? [];
    const shape = local.shape ?? DEFAULT_SHAPE;
    const insets = { ...DEFAULT_INSETS, ...local.insets };
    const plot: DiagramPlot = {
      left: insets.left,
      right: width() - insets.right,
      top: insets.top,
      bottom: height() - insets.bottom,
    };
    const specs = local.axes ?? [];
    const xScale = scaleFor(data, series, shape, "x", plot, specs.find((entry) => entry.orientation === "x"));
    const yScale = scaleFor(data, series, shape, "y", plot, specs.find((entry) => entry.orientation === "y"));

    return {
      shape,
      width: width(),
      height: height(),
      insets,
      plot,
      disc: discOf(plot),
      data,
      series,
      xScale,
      yScale,
      axes: axisViews(specs, xScale, yScale, plot),
    };
  });

  const content = () => {
    const children = local.children;
    if (typeof children === "function") return children(frame());
    // Превьюер сборки отдаёт `null` у узла без детей — это «своего содержимого нет», не «пусто».
    if (children) return children;
    if (frame().series.length === 0) return undefined;

    return <DefaultDiagramBody frame={frame()} grid={local.grid ?? true} innerRatio={local.innerRatio} />;
  };

  return (
    <svg
      ref={observe}
      {...dropAddress(rest)}
      width={local.width}
      height={local.height}
      viewBox={`0 0 ${width()} ${height()}`}
      {...anatomyParts.root.attrs}
    >
      {content()}
    </svg>
  );
}
