import type { Accessor } from "@web-core/solid";
import { feedStoreOf } from "../model";

/**
 * Чем накормлен таргет — и как его накормить.
 *
 * Единственный способ поставщику и потребителю еды встретиться: они не знают друг о друге и ходят
 * каждый сюда. Поставщик кладёт (`serve`), показ и все остальные читают (`data`), а `servedBy`
 * отвечает на вопрос «чем накормлено сейчас» — по нему интерфейс решает, чья панель настройки
 * открыта.
 *
 * Ключ доски называет вызывающий: кого кормим, знает он, а не доска. Сущности достаточно строки —
 * от того, компонент это или сборка из компонентов, она не меняется.
 */
export function useFeed(key: string | Accessor<string>) {
  const store = feedStoreOf(typeof key === "function" ? key : () => key);

  return {
    servedBy: () => store.selectors.portion()?.by,
    data: () => store.selectors.portion()?.data,
    serve: (by: string, data: unknown) => store.actions.serve(by, data),
  };
}
