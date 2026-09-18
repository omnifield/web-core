import { createEffect } from "solid-js";

import type { Consumer } from "../../entities/binding";
import { apiCatalogOf } from "../../entities/openapi";
import { ApiList, ApiManagerProvider } from "../../features/api-manager";
import { BindEndpoint } from "./bind-endpoint";

/**
 * Экран настройки одного API целиком: состав ручек и на каждой — путь «настроить → проверить →
 * привязать к потребителю → свести поля».
 *
 * `raw` грузится эффектом, а не один раз при монтировании: юзер заливает документ и перезаливает
 * его, и вторая загрузка обязана доехать так же, как первая.
 *
 * Потребители приходят пропом: движок не знает, какие компоненты есть у приложения и где брать
 * форму их входа — это знание живёт в приложении (см. `Consumer`).
 */
export function BindingEditor(props: {
  api: string;
  consumers: readonly Consumer[];
  /** Документ схемы (Swagger 2.0). Без него каталог наполняется вручную — `addEndpoint`. */
  raw?: string;
}) {
  createEffect(() => {
    if (props.raw !== undefined) void apiCatalogOf(props.api).actions.loadSchema(props.raw);
  });

  return (
    <ApiManagerProvider api={props.api}>
      <ApiList>
        {(endpoint) => (
          <BindEndpoint apiId={props.api} endpoint={endpoint} consumers={props.consumers} />
        )}
      </ApiList>
    </ApiManagerProvider>
  );
}
