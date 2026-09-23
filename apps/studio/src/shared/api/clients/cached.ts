import type { QueryClient } from "@web-core/query";
import type { PresetsCatalog, PresetKind } from "@web-core/skin/presets";

const key = (
  method: string,
  kind: PresetKind,
  argument?: readonly string[] | string,
) => ["presets", method, kind, argument ?? "все"];

/**
 * Тот же клиент пресетов, но чтения идут через кэш приложения.
 *
 * Нужен, чтобы у одних и тех же записей был ОДИН владелец сети: показ спрашивает форму компонента
 * ради списка вариантов, скин — ради CSS, и без общего кэша это два одинаковых запроса на каждый
 * переход. Протухание — по явной инвалидации, не по таймеру. Разбор — FAQ.md.
 */
export function cachedPresets(
  client: PresetsCatalog,
  queryClient: QueryClient,
): PresetsCatalog {
  const cache = <T>(parts: readonly unknown[], load: () => Promise<T>) =>
    queryClient.query<T>({
      queryKey: parts,
      queryFn: load,
      staleTime: Infinity,
    });

  return {
    ...client,
    list: (kind, options) =>
      cache(key("list", kind, options?.component), () =>
        client.list(kind, options),
      ),
    listHeaders: (kind, options) =>
      cache(key("heads", kind, options?.component), () =>
        client.listHeaders(kind, options),
      ),
    get: (kind, name) => cache(key("get", kind, name), () => client.get(kind, name)),
  };
}
