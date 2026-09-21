import { ApiCatalog, ExternalSchemaLoader } from "@web-core/feeder";
import { useEndpoint } from "#/entities/endpoint";
import { Flow, FlowItem } from "@web-core/ui";

/** Настройка API: загрузка документа схемы и каталог ручек с их правкой и вызовом.
 *
 *  Результат вызова не остаётся здесь: ответ ручки — образец, по которому сводят поля, а экран
 *  сведения живёт в главной области и этой панели не видит. Проба уходит в сущность, оттуда её
 *  и берут. */
export function ApiSetup() {
  const endpoint = useEndpoint();

  return (
    <Flow>
      <FlowItem>
        <ExternalSchemaLoader />
      </FlowItem>
      <FlowItem style={{ width: "100%" }}>
        <ApiCatalog
          onResult={(event) =>
            endpoint.remember(
              event.presetId,
              event.endpoint.id,
              event.result.body,
            )
          }
        />
      </FlowItem>
    </Flow>
  );
}
