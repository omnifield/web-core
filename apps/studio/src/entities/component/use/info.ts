import type { Accessor } from "@web-core/solid";
import type { ComponentDescriptor } from "@web-core/ui/component-info";
import { contentOf, variantsOf } from "../api";
import { componentStoreOf } from "../model";

/** То, что едет по сети: сами данные, признак ожидания и отказ — у каждого запроса свои. */
export interface Delivery<T> {
  readonly data: Accessor<T>;
  readonly isPending: Accessor<boolean>;
  readonly error: Accessor<Error | null>;
}

/**
 * Всё, что известно про один компонент, одним входом: синхронный срез из кита (паспорт, срез
 * редактора, io-схема) плюс то, что приезжает из службы пресетов.
 *
 * Синхронное лежит в ячейке семьи, асинхронное ведёт кэш запросов — копии в чьём-либо состоянии
 * нет намеренно. У каждого запроса своё ожидание: варианты и записи данных едут врозь и с разной
 * скоростью, общий признак заставлял бы ждать чужой запрос.
 */
export interface ComponentFacts {
  /** Имя компонента, оно же `data-scope` на каждом его узле. */
  readonly name: Accessor<string>;
  /** Машинная половина среза: части, состояния, настройки с умолчаниями и зависимостями. */
  readonly passport: Accessor<ComponentDescriptor["passport"]>;
  readonly editorInfo: Accessor<ComponentDescriptor["editorInfo"]>;
  readonly io: Accessor<ComponentDescriptor["io"]>;
  readonly variants: Delivery<Awaited<ReturnType<typeof variantsOf>>>;
  readonly content: Delivery<Awaited<ReturnType<typeof contentOf>>>;
}

/**
 * Имя названо явно — отвечаем про названный компонент; не названо — про активный.
 *
 * Явное имя нужно там, где компонент адресуют мимо текущего выбора (соседняя карточка,
 * изолированный показ); всем остальным активной ячейки достаточно, и знать имя им незачем.
 */
export function useInfo(name?: string | Accessor<string>): ComponentFacts {
  const named = typeof name === "function" ? name : () => name;
  const cell =
    name === undefined ? componentStoreOf.active() : componentStoreOf(named);

  const target = () => cell.selectors.name();
  // Ячейка-заглушка несёт пустое имя: запрашивать по нему нечего.
  const known = () => target() !== "";

  const variants = variantsOf.use(target, () => ({ enabled: known() }));
  const content = contentOf.use(target, () => ({ enabled: known() }));

  // Ожидания без таргета нет: `enabled: false` держал бы запрос в `pending` вечно.
  const waiting = (pending: boolean) => known() && pending;

  return {
    name: target,
    passport: () => cell.selectors.passport(),
    editorInfo: () => cell.selectors.editorInfo(),
    io: () => cell.selectors.io(),
    variants: {
      data: () => (waiting(variants.isPending) ? [] : (variants.data ?? [])),
      isPending: () => waiting(variants.isPending),
      error: () => variants.error,
    },
    content: {
      data: () => (waiting(content.isPending) ? [] : (content.data ?? [])),
      isPending: () => waiting(content.isPending),
      error: () => content.error,
    },
  };
}
