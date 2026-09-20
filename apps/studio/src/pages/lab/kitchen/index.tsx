import { Show } from "solid-js";
import { AdapterMastering } from "@web-core/feeder";
import { describeSample, describeSchema } from "@web-core/io";
import { Typography } from "@web-core/ui";
import { useComponent } from "#/entities/component";
import { useEndpoint } from "#/entities/endpoint";

// Вид участника в пути закреплён на стороне `@web-core/feeder` (там же живут адаптеры и поиск по
// ним). Пока построителей путей он наружу не отдаёт, пары собираются здесь — заменить на его
// вызовы, когда приедут.
const COMPONENT_USER = "component";
const API_USER = "api";

/** Сведение полей: слева поля выбранного компонента, справа — поля ответа дёрнутой ручки.
 *
 *  Правая колонка строится из ЖИВОГО ответа, а не из документа схемы: схемы ответа ручка не
 *  несёт — ни в дескрипторе, ни в `OpenapiEndpoint` (там схема запроса). Поэтому пока ручку не
 *  дёрнули, сводить не с чем, и экран говорит это словом. */
export function KitchenPage() {
  const component = useComponent();
  const endpoint = useEndpoint();

  const output = () => {
    const schema = component.io()?.schema;
    return schema === undefined ? [] : describeSchema(schema);
  };

  return (
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
          provider={[API_USER, probe().presetId, probe().endpointId]}
          consumer={[COMPONENT_USER, component.name]}
          output={output()}
          input={describeSample(probe().sample)}
        />
      )}
    </Show>
  );
}
