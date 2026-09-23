import { createAtom } from "@xstate/store";
import type { Atom, AtomOptions, Observer, ReadonlyAtom, Subscription } from "@xstate/store";
import { useAtom } from "@xstate/store-solid";
import { createComputed, createRoot, createSignal, getOwner, onCleanup, untrack } from "@web-core/solid";
import type { Accessor } from "@web-core/solid";
import { createSingletonRoot } from "@web-core/solid/rootless";

export interface ActionStoreHelpers<T> {
  readonly setState: Atom<T>["set"];
  readonly get: Atom<T>["get"];
}

type SelectorsShape<T> = Record<string, (state: T, ...args: never[]) => unknown>;

/**
 * Селектор без своих аргументов — как раньше, готовый реактивный аксессор `() => R`.
 * Селектор с аргументами ПОСЛЕ `state` (`(state, cell) => R`) — параметризованный геттер:
 * вызывается `store.selectors.x(arg)` и сразу отдаёт `R`, реактивно, без промежуточного `()`.
 * Различаются по arity сигнатуры внутри `createActionStore` (`fn.length`), не по отдельному флагу.
 */
type SelectorAccessor<T, F> = F extends (state: T) => infer R
  ? Accessor<R>
  : F extends (state: T, ...args: infer A) => infer R
    ? (...args: A) => R
    : never;

type SelectorAccessors<T, TSelectors extends SelectorsShape<T>> = {
  readonly [K in keyof TSelectors]: SelectorAccessor<T, TSelectors[K]>;
};

export interface ActionStore<T, TActions, TSelectors extends SelectorsShape<T> = Record<string, never>>
  extends ReadonlyAtom<T> {
  readonly actions: TActions;
  /** Вычисляемые значения, объявленные при создании стора — живут внутри, не собираются в компоненте. */
  readonly selectors: SelectorAccessors<T, TSelectors>;
  /** Селектор на месте, для разового/нестандартного случая — store.use(selector). */
  use<S = T>(selector?: (state: T) => S, compare?: (a: S | undefined, b: S) => boolean): Accessor<S>;
}

/**
 * Стор в стиле Zustand/Pinia — состояние плюс объект actions, которым это состояние меняют,
 * без прямого `.set()` наружу (в отличие от `createAtom`, у которого `.set()` публичный).
 *
 * Вычисляемые значения (Pinia-getters) объявляются ТРЕТЬИМ аргументом — `selectorsFactory` —
 * и живут внутри стора как `store.selectors.x()`, реактивный аксессор, готовый сразу; не нужно
 * тащить отдельную функцию-селектор в компонент и собирать стор на месте вызова.
 *
 * Перегрузка различает `selectorsFactory` и `options` по типу третьего аргумента (функция или
 * нет) — тот же приём, что у `createResourceAtom` для keyed/unkeyed вызова.
 *
 * Читается либо `useAtom(store, selector)`/`useSelector` как обычный атом (возвращаемое значение
 * — `ReadonlyAtom<T>`), либо `store.use(selector)` — то же самое, без отдельного импорта.
 * Не сделан вызываемым напрямую (`store(selector)`) — `@xstate/store-solid` отличает атом от
 * конфига по `typeof value === "object"` (`isAtom` в его исходнике); функция этой проверке не
 * пройдёт, и `useAtom(store, selector)` извне перестанет работать. Разбор — FAQ.md.
 */
export function createActionStore<T, TActions extends Record<string, (...args: never[]) => unknown>>(
  initialValue: T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  options?: AtomOptions<T>,
): ActionStore<T, TActions>;
export function createActionStore<
  T,
  TActions extends Record<string, (...args: never[]) => unknown>,
  TSelectors extends SelectorsShape<T>,
>(
  initialValue: T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  selectorsFactory: () => TSelectors,
  options?: AtomOptions<T>,
): ActionStore<T, TActions, TSelectors>;
export function createActionStore<
  T,
  TActions extends Record<string, (...args: never[]) => unknown>,
  TSelectors extends SelectorsShape<T> = Record<string, never>,
>(
  initialValue: T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  selectorsFactoryOrOptions?: (() => TSelectors) | AtomOptions<T>,
  maybeOptions?: AtomOptions<T>,
): ActionStore<T, TActions, TSelectors> {
  const withSelectors = typeof selectorsFactoryOrOptions === "function";
  const selectorsFactory = withSelectors ? (selectorsFactoryOrOptions as () => TSelectors) : undefined;
  const options = withSelectors ? maybeOptions : (selectorsFactoryOrOptions as AtomOptions<T> | undefined);

  const atom = createAtom<T>(initialValue, options);
  const actions = actionsFactory({ setState: atom.set, get: atom.get });

  const selectors = {} as SelectorAccessors<T, TSelectors>;
  if (selectorsFactory !== undefined) {
    const selectorFns = selectorsFactory();
    createRoot(() => {
      for (const key of Object.keys(selectorFns) as (keyof TSelectors)[]) {
        const fn = selectorFns[key] as unknown as (state: T, ...args: unknown[]) => unknown;
        if (fn.length <= 1) {
          (selectors as Record<keyof TSelectors, Accessor<unknown>>)[key] = useAtom(atom, fn);
          continue;
        }

        // Параметризованный геттер: своя подписка на каждый набор аргументов, лениво и с кэшем
        // по ключу — тот же приём, что у createActionStoreFamily по K, только уровнем ниже
        // (внутри одного стора, не между сторами). Подписка живёт в корне со счётчиком
        // слушателей: гаснет, когда уходит последний читающий владелец. Разбор — FAQ.md.
        const cache = new Map<string, () => Accessor<unknown>>();
        (selectors as Record<keyof TSelectors, (...args: unknown[]) => unknown>)[key] = (...args: unknown[]) => {
          // Вызов без реактивного владельца (тест, роутер, обычная функция) — считать некого:
          // разовое значение из снапшота, как у .get(), без подписки и без корня.
          if (getOwner() === null) return fn(atom.get(), ...args);

          const cacheKey = args.map((arg) => (typeof arg === "object" && arg !== null ? JSON.stringify(arg) : String(arg))).join(" ");
          let subscribe = cache.get(cacheKey);
          if (subscribe === undefined) {
            // Корень отвязан от владельца явно (второй аргумент `null`): по умолчанию
            // createSingletonRoot цепляется к тому, кто вызвал первым, — а подписка кэширована
            // и переиспользуется остальными, гасить её должен счётчик, а не первый читатель.
            subscribe = createSingletonRoot(() => useAtom(atom, (state: T) => fn(state, ...args)), null);
            cache.set(cacheKey, subscribe);
          }
          return subscribe()();
        };
      }
    });
  }

  function use<S = T>(selector?: (state: T) => S, compare?: (a: S | undefined, b: S) => boolean): Accessor<S> {
    return selector === undefined ? (useAtom(atom) as unknown as Accessor<S>) : useAtom(atom, selector, compare);
  }

  return { get: atom.get, subscribe: atom.subscribe, actions, selectors, use };
}

/**
 * `absent` — адресовать нечего: активного ключа нет, ячейка дефолтная и запись в неё заглушена.
 * `initial` — настоящая ячейка, но в неё ещё ни разу не писали. `written` — писали хотя бы раз.
 */
export type ActionStoreCellStatus = "absent" | "initial" | "written";

/** Стор, полученный от семьи: тот же `ActionStore` плюс пометка, чью ячейку читаешь и в каком она виде. */
export interface ActionStoreCell<T, TActions, TSelectors extends SelectorsShape<T>, K>
  extends ActionStore<T, TActions, TSelectors> {
  readonly key: Accessor<K | undefined>;
  readonly status: Accessor<ActionStoreCellStatus>;
}

/** Опции семьи, у которой начальное значение задано функцией ключа: `empty` — значение ячейки-заглушки. */
export interface ActionStoreFamilyOptions<T> extends AtomOptions<T> {
  readonly empty: T;
}

/**
 * Семья сторов: ключом её зовут либо значением (стор фиксирован), либо Solid-аксессором (стор
 * переезжает вслед за ключом), либо не зовут вовсе — `active()` отдаёт ячейку активного ключа.
 * Разбор режимов — README и FAQ.md.
 */
export interface ActionStoreFamily<T, TActions, TSelectors extends SelectorsShape<T>, K> {
  (key: K | undefined): ActionStoreCell<T, TActions, TSelectors, K>;
  (key: Accessor<K | undefined>): ActionStoreCell<T, TActions, TSelectors, K>;
  /** Родить ячейку явной операцией: есть — отдаёт её же, нет — создаёт и наполняет фабрикой ключа. */
  create(key: K): ActionStoreCell<T, TActions, TSelectors, K>;
  /** Сделать ячейку активной. Заранее создавать её не обязательно — ячейка рождается при первом обращении. */
  activate(key: K | undefined): void;
  /** Ячейка активного ключа: тот же стор, подписка переезжает за активацией. */
  active(): ActionStoreCell<T, TActions, TSelectors, K>;
}

/** Объект той же формы, где каждый вызов адресован стору, который актуален в момент вызова. */
function forwardCalls<TShape extends object>(shape: TShape, target: () => TShape): TShape {
  const forwarded: Record<string, unknown> = {};
  for (const name of Object.keys(shape)) {
    forwarded[name] = (...args: unknown[]) =>
      (target()[name as keyof TShape] as (...forwardedArgs: unknown[]) => unknown)(...args);
  }
  return forwarded as TShape;
}

/**
 * Стор семьи, адресованный аксессором ключа: наружу — обычный `ActionStore`, внутри — одна
 * подписка, которая переезжает на стор нового ключа. Состояние прежнего ключа не трогается, оно
 * остаётся в `Map` семьи. Почему это живёт здесь, а не ремаунтом поддерева у потребителя, — FAQ.md.
 */
function storeBoundToKey<T, TActions, TSelectors extends SelectorsShape<T>, K>(
  storeOf: (key: K | undefined) => ActionStoreCell<T, TActions, TSelectors, K>,
  key: Accessor<K | undefined>,
): ActionStoreCell<T, TActions, TSelectors, K> {
  const currentStore = () => storeOf(key());
  const shape = untrack(currentStore);

  const facade: ActionStoreCell<T, TActions, TSelectors, K> = {
    key,
    status: () => currentStore().status(),

    get: () => currentStore().get(),

    subscribe(
      observerOrNext: Observer<T> | ((value: T) => void),
      error?: (error: unknown) => void,
      complete?: () => void,
    ): Subscription {
      const notify = typeof observerOrNext === "function" ? observerOrNext : observerOrNext.next;
      const subscribeTo = (store: ActionStoreCell<T, TActions, TSelectors, K>): Subscription =>
        typeof observerOrNext === "function"
          ? store.subscribe(observerOrNext, error, complete)
          : store.subscribe(observerOrNext);

      // Первая подписка — синхронно, до вычисления: между вызовом subscribe и первым прогоном
      // читатель иначе пропустил бы изменения текущего стора.
      let subscribed = untrack(key);
      let inner = subscribeTo(storeOf(subscribed));

      let disposeRoot = (): void => {};
      createRoot((dispose) => {
        disposeRoot = dispose;
        // Переезд — В ФАЗЕ ВЫЧИСЛЕНИЙ, не эффектом: get/селекторы адресуют стор текущего ключа
        // синхронно, и подписка обязана успеть туда же до того, как отработает хоть один
        // читательский эффект. Разбор — FAQ.md.
        createComputed(() => {
          const next = key();
          if (next === subscribed) return;
          subscribed = next;

          inner.unsubscribe();
          const store = storeOf(next);
          inner = subscribeTo(store);
          notify?.(store.get()); // ключ сменился — для читателя это новое значение
        });
        onCleanup(() => inner.unsubscribe());
      });

      return { unsubscribe: disposeRoot };
    },

    // Запись адресует стор текущего ключа, но сама зависимостью от ключа не становится:
    // вызов action из реактивного кода не должен подписывать этот код на ключ.
    actions: forwardCalls(shape.actions as object, () => untrack(currentStore).actions as object) as TActions,
    selectors: forwardCalls(shape.selectors as object, () => currentStore().selectors as object) as SelectorAccessors<
      T,
      TSelectors
    >,

    use<S = T>(selector?: (state: T) => S, compare?: (a: S | undefined, b: S) => boolean): Accessor<S> {
      return selector === undefined
        ? (useAtom(facade) as unknown as Accessor<S>)
        : useAtom(facade, selector, compare);
    },
  };

  return facade;
}

/**
 * Семья `createActionStore` — отдельный физический стор на каждый ключ, не один общий слот с
 * переключаемым содержимым. Нужен, когда несколько сущностей живы ОДНОВРЕМЕННО и не должны видеть
 * данные друг друга (конечный/известный набор ключей — каталог компонентов, вкладки и т.п.). Если
 * в моменте жив ровно один инстанс, а ключей может быть много — это `createResourceAtom`, не эта
 * функция: там переключение ключа обязано смыть предыдущее значение (async-гэп/race-guard), здесь
 * наоборот — переключение обязано ничего не смыть, каждый ключ хранит своё независимо.
 *
 * Ленивое создание + кэш (`Map<K, ActionStore<...>>`): `actionsFactory`/`selectorsFactory`
 * вызываются один раз на первое обращение к ключу, дальше отдаётся тот же инстанс. Без политики
 * вытеснения — рассчитана на конечный/известный набор ключей, не на неограниченный поток (там
 * кэш растёт без границ, это осознанный компромисс, не забытый случай).
 *
 * `K` — ключ `Map`, сравнение по `SameValueZero` как у самой `Map`: примитивы (строка, число)
 * сравниваются по значению, объекты — по ссылке. Для конечного каталога (имя компонента, id
 * вкладки) это ровно то, что нужно; для составных ключей нужен свой `toKey(k): string` снаружи.
 *
 * Ключ зовут тремя способами. Значением (`familyOf("button")`) — стор фиксирован на всё время
 * жизни вызывающего. Solid-аксессором (`familyOf(() => params().component)`) — отдаётся тот же
 * стор, но подписка переезжает на стор нового ключа сама; состояние прежнего остаётся в `Map`
 * нетронутым. Без ключа (`familyOf.active()` после `familyOf.activate(key)`) — то же самое, но
 * ключ семья держит у себя, и читателю знать его не нужно. Режимы различаются по
 * `typeof key === "function"`, и цена этого известна: ключ, который сам является функцией,
 * аксессором неадресуем.
 *
 * Начальное значение — либо одно на все ячейки, либо функция ключа (`(key) => T`), когда ячейка
 * при рождении обязана нести то, что считается ИЗ её ключа. Форма-функция заодно снимает общий
 * объект по ссылке у всех ячеек и требует `options.empty` — значение ячейки-заглушки; на заглушку
 * фабрика ключа не зовётся, ключа у неё нет.
 *
 * Ключ `undefined` (активного ещё нет либо его сняли) адресует ОДНУ дефолтную ячейку — она не
 * попадает в `Map` и запись в неё заглушена: читается как обычная, `status()` у неё `absent`.
 */
export function createActionStoreFamily<T, TActions extends Record<string, (...args: never[]) => unknown>, K = string>(
  initialValue: T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  options?: AtomOptions<T>,
): ActionStoreFamily<T, TActions, Record<string, never>, K>;
export function createActionStoreFamily<
  T,
  TActions extends Record<string, (...args: never[]) => unknown>,
  K = string,
>(
  initialValue: (key: K) => T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  options: ActionStoreFamilyOptions<T>,
): ActionStoreFamily<T, TActions, Record<string, never>, K>;
export function createActionStoreFamily<
  T,
  TActions extends Record<string, (...args: never[]) => unknown>,
  TSelectors extends SelectorsShape<T>,
  K = string,
>(
  initialValue: T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  selectorsFactory: () => TSelectors,
  options?: AtomOptions<T>,
): ActionStoreFamily<T, TActions, TSelectors, K>;
export function createActionStoreFamily<
  T,
  TActions extends Record<string, (...args: never[]) => unknown>,
  TSelectors extends SelectorsShape<T>,
  K = string,
>(
  initialValue: (key: K) => T,
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  selectorsFactory: () => TSelectors,
  options: ActionStoreFamilyOptions<T>,
): ActionStoreFamily<T, TActions, TSelectors, K>;
export function createActionStoreFamily<
  T,
  TActions extends Record<string, (...args: never[]) => unknown>,
  TSelectors extends SelectorsShape<T> = Record<string, never>,
  K = string,
>(
  initialValue: T | ((key: K) => T),
  actionsFactory: (helpers: ActionStoreHelpers<T>) => TActions,
  selectorsFactoryOrOptions?: (() => TSelectors) | AtomOptions<T>,
  maybeOptions?: AtomOptions<T>,
): ActionStoreFamily<T, TActions, TSelectors, K> {
  const withSelectors = typeof selectorsFactoryOrOptions === "function";
  const selectorsFactory = withSelectors ? (selectorsFactoryOrOptions as () => TSelectors) : undefined;
  const options = withSelectors ? maybeOptions : (selectorsFactoryOrOptions as AtomOptions<T> | undefined);

  const initialOf = typeof initialValue === "function" ? (initialValue as (key: K) => T) : undefined;
  if (initialOf !== undefined && !(options !== undefined && "empty" in options)) {
    throw new Error(
      "createActionStoreFamily: начальное значение задано функцией ключа — задайте options.empty, значение ячейки-заглушки (ключа ещё нет)",
    );
  }
  const emptyValue = initialOf === undefined ? (initialValue as T) : (options as ActionStoreFamilyOptions<T>).empty;

  const cache = new Map<K, ActionStoreCell<T, TActions, TSelectors, K>>();
  const [activeKey, setActiveKey] = createSignal<K | undefined>(undefined);
  let emptyCell: ActionStoreCell<T, TActions, TSelectors, K> | undefined;
  let activeCell: ActionStoreCell<T, TActions, TSelectors, K> | undefined;

  function createCell(key: K | undefined, value: T, writable: boolean): ActionStoreCell<T, TActions, TSelectors, K> {
    const [written, setWritten] = createSignal(false);

    const factory = (helpers: ActionStoreHelpers<T>): TActions => {
      const setState: Atom<T>["set"] = writable
        ? (next: T | ((prev: T) => T)) => {
            setWritten(true);
            helpers.setState(next as T);
          }
        : () => {};
      return actionsFactory({ setState, get: helpers.get });
    };

    const store =
      selectorsFactory !== undefined
        ? createActionStore<T, TActions, TSelectors>(value, factory, selectorsFactory, options)
        : (createActionStore<T, TActions>(value, factory, options) as ActionStore<T, TActions, TSelectors>);

    return {
      ...store,
      key: () => key,
      status: () => (!writable ? "absent" : written() ? "written" : "initial"),
    };
  }

  function getOrCreate(key: K | undefined): ActionStoreCell<T, TActions, TSelectors, K> {
    if (key === undefined) {
      if (emptyCell === undefined) emptyCell = createCell(undefined, emptyValue, false);
      return emptyCell;
    }

    const cached = cache.get(key);
    if (cached !== undefined) return cached;

    const cell = createCell(key, initialOf === undefined ? (initialValue as T) : initialOf(key), true);
    cache.set(key, cell);
    return cell;
  }

  function storeOf(key: K | undefined | Accessor<K | undefined>): ActionStoreCell<T, TActions, TSelectors, K> {
    return typeof key === "function"
      ? storeBoundToKey(getOrCreate, key as Accessor<K | undefined>)
      : getOrCreate(key as K | undefined);
  }

  storeOf.create = (key: K): ActionStoreCell<T, TActions, TSelectors, K> => getOrCreate(key);

  storeOf.activate = (key: K | undefined): void => {
    setActiveKey(() => key);
  };

  storeOf.active = (): ActionStoreCell<T, TActions, TSelectors, K> => {
    if (activeCell === undefined) activeCell = storeBoundToKey(getOrCreate, activeKey);
    return activeCell;
  };

  return storeOf as ActionStoreFamily<T, TActions, TSelectors, K>;
}
