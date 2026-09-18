import { createContext, Show, useContext, type JSX } from "solid-js";

import { apiCatalogOf } from "../../../entities/openapi";

const ApiIdContext = createContext<string>();

/**
 * Провайдер работает с ОДНИМ API — его айди приходит пропом, всё, что внутри, говорит про этот
 * бэк и ни про какой другой (та же роль, что у `ComponentManagerProvider` в студии: имя пропом →
 * свой стор из семьи).
 *
 * Сам каталог ручек живёт в `entities/openapi` (`apiCatalogOf`), а не здесь: набор ручек одного
 * бэка — структура, а не действие интерфейса, и читать её нужно не только этому экрану, но и
 * сборке, которая кормит компонент на витрине. Фича даёт поверх этой структуры ровно то, что
 * относится к интерфейсу: «с каким API мы сейчас работаем».
 *
 * Документ схемы провайдер НЕ подхватывает пропом намеренно: в отличие от студии, где всё
 * состояние выводится из самого ключа (дескриптор компонента), здесь документ приносит юзер уже
 * после монтирования (загрузил файл, вставил текст) — засев из пропа в этом месте был бы
 * одноразовым и молча игнорировал бы вторую загрузку. Грузят действием: `loadSchema`.
 */
export function ApiManagerProvider(props: {
  api: string | undefined;
  children: JSX.Element;
}) {
  return (
    <Show when={props.api} keyed>
      {(api) => (
        <ApiIdContext.Provider value={api}>{props.children}</ApiIdContext.Provider>
      )}
    </Show>
  );
}

export function useApiId(): string {
  const api = useContext(ApiIdContext);
  if (api === undefined) {
    throw new Error("useApiId must be called within ApiManagerProvider");
  }
  return api;
}

/** Каталог текущего API — короткая форма `apiCatalogOf(useApiId())`, которую иначе пишет каждый
 *  компонент внутри провайдера. */
export function useApiCatalog(): ReturnType<typeof apiCatalogOf> {
  return apiCatalogOf(useApiId());
}
