import { ExternalSchemaLoader, ApiCatalog } from "@web-core/feeder";

/** Настройка API выбранного компонента: откуда он берёт еду и какая ручка за это отвечает.
 *
 *  Пока заглушка — место занято намеренно. Правый рейл кухни монтирует фичу по вкладке `api`,
 *  и без этого экспорта половина экрана молча пустеет. Заглушка говорит это вслух. */
export function ApiConfiguration() {
  return (
    <>
      <ExternalSchemaLoader />
      <ApiCatalog
        onResult={(e) => {
          console.log(e);
        }}
      />
    </>
  );
}
