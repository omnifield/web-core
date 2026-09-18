import { Typography } from "@web-core/ui";
import type { JSX } from "solid-js";

import { FeederPanel } from "#/features/feeder";

/**
 * Фича кухни — ОДНА пара «настройка + рабочая поверхность», а не один компонент: у каждой фичи
 * лаба обе зоны заняты сразу (в правом рейле настраивают, в main работают), и порознь они
 * бессмысленны — настройка без поверхности ничего не меняет, поверхность без настройки нечем
 * наполнить.
 *
 * Пара лежит ОДНОЙ записью, потому что монтируется она в двух разных местах дерева: рейл живёт в
 * каркасе лаба (`LabPage`), поверхность — в дочернем маршруте (`KitchenPage`), и связать их может
 * только общий реестр. Два списка — по одному на зону — разъезжались бы молча: фича, забытая в
 * одном из них, дала бы пустую половину экрана без единого слова о причине.
 */
export interface KitchenFeature {
  /** Айди — он же `$feature` в урле: кухня целиком адресуется ссылкой. */
  readonly id: string;
  readonly title: string;
  /** Правый рейл — чем фичу настраивают. */
  readonly rightbar: () => JSX.Element;
  /** Main — над чем работают выбранным компонентом. */
  readonly main: () => JSX.Element;
}

export const KITCHEN_FEATURES: readonly KitchenFeature[] = [
  {
    id: "api",
    title: "API",
    // Панель движка пока монтируется целиком — со своим айди API и своим выбором потребителя
    // внутри. На кухне ни то, ни другое так не останется: потребитель здесь не выбирается, он и
    // есть компонент из сайдбара, а сведение уезжает в main. Разбираем на следующих шагах.
    rightbar: () => <FeederPanel />,
    main: () => (
      <Typography>Адаптер: сведение ответа ручки на вход выбранного компонента</Typography>
    ),
  },
];

export function kitchenFeatureBy(id: string | undefined): KitchenFeature | undefined {
  return KITCHEN_FEATURES.find((feature) => feature.id === id);
}
