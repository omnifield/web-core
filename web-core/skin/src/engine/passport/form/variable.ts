
import type { StepPurposeClass } from "@web-core/style";

export interface PassportVariable {
  readonly name: string;
  readonly setBy: "kit" | "consumer";
  /** Класс ступени, который вправе нести переменная-контейнер под цвет. Не объявлено — гейт
   *  назначения её не трогает (разбор — FAQ.md). */
  readonly colorPurpose?: StepPurposeClass;
}
