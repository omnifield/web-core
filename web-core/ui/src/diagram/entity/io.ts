import { z } from "@web-core/io";

const row = z.record(z.string(), z.unknown());

/** Серия — ЧТО показывать: какие поля, как подписать, чем покрасить. Форма (линия/столбцы/…)
 * сюда не входит: её выбирает сборка пропом `shape` (`README.md`). */
const series = z.object({
  /** Имя поля точки данных, не аксессор: функция не переживает ни хранение, ни редактор. */
  x: z.string(),
  y: z.string(),
  /** Подпись серии — для легенды и подсказки. */
  label: z.string().optional(),
  /** Готовое CSS-значение на всю серию (обычно ссылка на категорию палитры). */
  color: z.string().optional(),
  /** Имя поля, в котором лежит цвет ОТДЕЛЬНОЙ точки; сильнее, чем `color`. */
  colorField: z.string().optional(),
});

const scaleKind = z.enum(["linear", "band", "time", "log"]);

const axis = z.object({
  orientation: z.enum(["x", "y"]),
  scale: scaleKind.optional(),
  /** Границы шкалы; не заданы — считаются по данным. */
  domain: z.tuple([z.number(), z.number()]).optional(),
  label: z.string().optional(),
  ticks: z.number().optional(),
  /** Ось объявлена, но рисовать её не надо — сетка по ней при этом остаётся. */
  hidden: z.boolean().optional(),
});

const insets = z.object({
  top: z.number().optional(),
  right: z.number().optional(),
  bottom: z.number().optional(),
  left: z.number().optional(),
});

export const input = z.object({
  data: z.array(row),
  series: z.array(series),
  /** Уточнение выведенных осей; не задано — оси выводятся из серий. */
  axes: z.array(axis).optional(),
  insets: insets.optional(),
});

export type Data = z.infer<typeof input>;
export type DiagramRow = z.infer<typeof row>;
export type DiagramSeriesSpec = z.infer<typeof series>;
export type DiagramAxisSpec = z.infer<typeof axis>;
export type DiagramScaleKind = z.infer<typeof scaleKind>;
export type DiagramInsets = z.infer<typeof insets>;
