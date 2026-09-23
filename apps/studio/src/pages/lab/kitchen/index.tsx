import { Show } from "@web-core/solid";
import { AdapterMastering, API_USER } from "@web-core/feeder";
import { describeSample, describeSchema } from "@web-core/io";
import { Surface, Typography } from "@web-core/ui";
import { COMPONENT_USER, useInfo } from "#/entities/component";
import { useEndpoint } from "#/entities/endpoint";

/** Сведение полей: слева поля выбранного компонента, справа — поля ответа дёрнутой ручки.
 *
 *  Правая колонка строится из ЖИВОГО ответа, а не из документа схемы: схемы ответа ручка не
 *  несёт — ни в дескрипторе, ни в `OpenapiEndpoint` (там схема запроса). Поэтому пока ручку не
 *  дёрнули, сводить не с чем, и экран говорит это словом. */
export function KitchenPage() {
  const component = useInfo();
  const endpoint = useEndpoint();

  const output = () => {
    const schema = component.io()?.schema;
    return schema === undefined ? [] : describeSchema(schema);
  };

  return (
    <Surface data-variant="filled">
      <Show
        when={endpoint.probe()}
        fallback={
          <Typography>
            Дёрните ручку в панели справа — сводить поля будем с её ответом.
          </Typography>
        }
      >
        {(probe) => (
          <AdapterMastering
            provider={API_USER.path(probe().presetId, probe().endpointId)}
            consumer={COMPONENT_USER.path(component.name())}
            output={output()}
            input={describeSample(probe().sample)}
          />
        )}
      </Show>
    </Surface>
  );
}
