import {
  type Accessor,
  createContext,
  createMemo,
  type JSX,
  Show,
  useContext,
} from "solid-js";
import {
  type ComponentDescriptor,
  componentDescriptorOf,
} from "@web-core/ui/component-info";
import { contentOf, variantsOf } from "../api";

/**
 * Всё, что известно про ОДИН компонент, одним входом: синхронный срез из кита (паспорт, срез
 * редактора, io-схема) плюс то, что приезжает из службы пресетов (варианты, пресеты данных).
 *
 * Заведено здесь, а не в фиче, по двум причинам. Во-первых, это ответ на вопрос «что это за
 * компонент» — он не зависит от того, кто смотрит: показ, скин-редактор и песочница увидят
 * одно и то же. Во-вторых, склейка из трёх источников, написанная по месту, разъезжается: ровно
 * это уже произошло в ките (см. комментарий к `componentDescriptorOf`), и повторять не будем.
 *
 * Асинхронную часть ведёт кэш запросов (`defineQuery` → TanStack) — он и есть её стор. Копии в
 * чьём-либо ещё состоянии нет намеренно: копия не умеет ни показать загрузку, ни рассказать об
 * ошибке, ни обновиться, а расходиться с оригиналом умеет.
 */
export interface ComponentFacts {
  /** Имя компонента, оно же `data-scope` на каждом его узле. */
  readonly name: Accessor<string>;
  /** Машинная половина среза: части, состояния, настройки с их умолчаниями и зависимостями. */
  readonly passport: Accessor<ComponentDescriptor["passport"]>;
  readonly editorInfo: Accessor<ComponentDescriptor["editorInfo"]>;
  readonly io: Accessor<ComponentDescriptor["io"]>;
  readonly variants: Accessor<Awaited<ReturnType<typeof variantsOf>>>;
  readonly content: Accessor<Awaited<ReturnType<typeof contentOf>>>;
  /** Асинхронная часть ещё едет. Синхронная (`editorInfo`/`io`) доступна и в этот момент. */
  readonly isPending: Accessor<boolean>;
  /** Отказ службы пресетов. Раньше его не было видно вовсе: загрузку звали висящим промисом без
   *  `.catch`, и упавший запрос оставлял пустой экран без единого слова. */
  readonly error: Accessor<Error | null>;
}

const ComponentContext = createContext<ComponentFacts>();

export function ComponentProvider(props: {
  name: string | undefined;
  children: JSX.Element;
}) {
  return (
    <Show when={props.name}>
      {(name) => {
        const descriptor = createMemo(() => componentDescriptorOf(name()));
        const variants = variantsOf.use(name);
        const content = contentOf.use(name);

        const facts: ComponentFacts = {
          name,
          passport: () => descriptor().passport,
          editorInfo: () => descriptor().editorInfo,
          io: () => descriptor().io,
          variants: () => variants.data ?? [],
          content: () => content.data ?? [],
          isPending: () => variants.isPending || content.isPending,
          error: () => variants.error ?? content.error,
        };

        return (
          <ComponentContext.Provider value={facts}>
            {props.children}
          </ComponentContext.Provider>
        );
      }}
    </Show>
  );
}

export function useComponent(): ComponentFacts {
  const facts = useContext(ComponentContext);
  if (facts === undefined) {
    throw new Error("useComponent must be called within ComponentProvider");
  }
  return facts;
}
