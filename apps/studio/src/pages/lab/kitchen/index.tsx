import { useParams } from "@web-core/router";
import { Typography } from "@web-core/ui";
import { Show } from "solid-js";
import { ComponentProvider } from "#/entities/component";
import { kitchenFeatureBy } from "../model";

/**
 * Рабочая поверхность кухни — то, над чем работают ВЫБРАННЫМ компонентом в ВЫБРАННОЙ фиче.
 *
 * Компонент приходит провайдером, а не пропом вниз: фича на этой поверхности знает про компонент
 * всё (паспорт, io-схема, пресеты), и таскать это через реестр значило бы описывать в реестре
 * форму того, что фича сама умеет спросить.
 */
export function KitchenPage() {
  const params = useParams({ strict: false }) as () => {
    component?: string;
    feature?: string;
  };

  return (
    <Show
      when={params().component}
      fallback={<Typography>Выберите компонент слева</Typography>}
    >
      {(component) => (
        <ComponentProvider name={component()}>
          <Show
            when={kitchenFeatureBy(params().feature)}
            fallback={<Typography>Выберите фичу справа</Typography>}
          >
            {(active) => active().main()}
          </Show>
        </ComponentProvider>
      )}
    </Show>
  );
}
