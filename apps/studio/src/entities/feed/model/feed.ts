import { useComponent } from "#/entities/component";
import { feedStoreOf } from "./store";

/**
 * Чем накормлен текущий компонент — и как его накормить.
 *
 * Единственный способ поставщику и потребителю еды встретиться: они не знают друг о друге и
 * ходят каждый сюда. Поставщик кладёт (`serve`), показ и все остальные читают (`data`), а
 * `servedBy` отвечает на вопрос «чем накормлено сейчас» — по нему интерфейс решает, чья панель
 * настройки открыта.
 *
 * Своего провайдера у сущности нет: компонент уже назван контекстом выше (`ComponentProvider`),
 * а стор берётся по его имени. Второй контекст рядом давал бы тот же результат и ещё одно место,
 * где эти два имени могут разойтись.
 */
export function useFeed() {
  const store = feedStoreOf(useComponent().name);

  return {
    servedBy: () => store.selectors.portion()?.by,
    data: () => store.selectors.portion()?.data,
    serve: (by: string, data: unknown) => store.actions.serve(by, data),
  };
}
