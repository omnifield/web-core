import type { RowsResult } from "@web-core/io";
import { createResource, type Resource } from "solid-js";

import {
  applyBinding,
  bindingStoreOf,
  isFed,
  noFeed,
  type Binding,
} from "../../entities/binding";
import { apiCatalogOf, endpointBy } from "../../entities/openapi";
import { invokeEndpoint } from "../../features/invoke-endpoint";

/**
 * Дёрнуть привязанную ручку и отдать её ответ уже в форме потребителя — сборка четырёх кусков:
 * каталог ручек и привязка (`entities`), вызов (`features/invoke-endpoint`), применение
 * адаптера (`entities/binding`). Поэтому слой — `widgets`: собственной механики здесь нет, есть
 * порядок, в котором всё это происходит.
 *
 * Исход ВСЕГДА один и тот же `RowsResult` — и на успехе, и на «ручки нет в каталоге», и на 500,
 * и на оборванной сети: тот, кто кормит компонент, не должен разбирать четыре разных вида беды
 * четырьмя разными способами. Исключение сюда не выходит.
 */
export async function feedOf(binding: Binding): Promise<RowsResult> {
  const catalog = apiCatalogOf(binding.source.apiId);
  const endpoint = endpointBy(catalog.get(), binding.source.endpointId);
  if (endpoint === undefined) {
    return noFeed(
      `ручки «${binding.source.endpointId}» нет в каталоге API «${binding.source.apiId}» — схему не загрузили или ручку убрали уже после привязки`,
    );
  }

  let result;
  try {
    result = await invokeEndpoint(endpoint, binding.source.value);
  } catch (error) {
    return noFeed(
      `ручка не ответила: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Не-2xx сам по себе не исключение (см. `invokeEndpoint`), но и не еда: тело ошибки на вход
  // компонента класть нельзя, а вот назвать статус — можно и нужно.
  if (!result.ok) return noFeed(`ручка ответила ${result.status}`);

  return applyBinding(result.body, binding);
}

/** Привязка, которой кормят компонент: первая доведённая до адаптера, иначе первая вообще —
 *  чтобы недоделанная привязка объяснила себя («без адаптера»), а не притворилась отсутствием. */
export function feedBindingOf(component: string): Binding | undefined {
  const state = bindingStoreOf(component).get();
  return state.bindings.find(isFed) ?? state.bindings[0];
}

/**
 * Реактивный вход для витрины: компонент называет себя — получает свою еду. Про API, ручки и
 * правила он не знает ничего.
 *
 * Привязки нет — ресурс не стреляет вообще (источник `undefined`), а не ходит в сеть впустую.
 */
export function useFeed(component: string): {
  feed: Resource<RowsResult>;
  refetch: () => void;
} {
  const store = bindingStoreOf(component);
  const binding = store.use((state) => state.bindings.find(isFed) ?? state.bindings[0]);

  const [feed, { refetch }] = createResource(binding, feedOf);
  return { feed, refetch: () => void refetch() };
}
