import { render } from "@web-core/solid/web";
import { createSignal } from "@web-core/solid";
import { afterEach, describe, expect, it } from "vitest";

import { createActionStore, createActionStoreFamily } from "../src/engine/action-store.js";
import { useAtom } from "../src/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

interface User {
  readonly id: string;
  readonly name: string;
}

interface UserState {
  readonly user: User | null;
  readonly loading: boolean;
}

function createUserStore(fetchUser: () => Promise<User>) {
  return createActionStore<UserState, { setUser(user: User): void; clearUser(): void; loadUser(): Promise<void> }>(
    { user: null, loading: false },
    ({ setState }) => ({
      setUser(user: User) {
        setState((state) => ({ ...state, user }));
      },
      clearUser() {
        setState((state) => ({ ...state, user: null }));
      },
      async loadUser() {
        setState((state) => ({ ...state, loading: true }));
        try {
          const user = await fetchUser();
          setState((state) => ({ ...state, user, loading: false }));
        } catch (error) {
          setState((state) => ({ ...state, loading: false }));
          throw error;
        }
      },
    }),
  );
}

describe("createActionStore (кейс userStore из ТЗ)", () => {
  it("actions.setUser/clearUser меняют state, .set() наружу не торчит", () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "1", name: "A" }));

    expect((userStore as { set?: unknown }).set).toBeUndefined();

    userStore.actions.setUser({ id: "1", name: "A" });
    expect(userStore.get()).toEqual({ user: { id: "1", name: "A" }, loading: false });

    userStore.actions.clearUser();
    expect(userStore.get().user).toBeNull();
  });

  it("асинхронный action проходит через loading: true → done, промежуточные .set() видны", async () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "2", name: "B" }));

    const promise = userStore.actions.loadUser();
    expect(userStore.get().loading).toBe(true);

    await promise;
    expect(userStore.get()).toEqual({ user: { id: "2", name: "B" }, loading: false });
  });

  it("ошибка в action сбрасывает loading и пробрасывается вызывающему", async () => {
    const userStore = createUserStore(() => Promise.reject(new Error("boom")));

    await expect(userStore.actions.loadUser()).rejects.toThrow("boom");
    expect(userStore.get().loading).toBe(false);
  });

  it("через useAtom с селектором отдаёт то же значение живому компоненту", async () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "3", name: "C" }));

    function Profile() {
      const userName = useAtom(userStore, (state) => state.user?.name);
      return <p>{userName() ?? "none"}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Profile />, host);

    expect(host.textContent).toBe("none");
    await userStore.actions.loadUser();
    expect(host.textContent).toBe("C");
  });

  it("store.use(selector) — то же чтение, без отдельного импорта useAtom", async () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "4", name: "D" }));

    function Profile() {
      const userName = userStore.use((state) => state.user?.name);
      return <p>{userName() ?? "none"}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Profile />, host);

    expect(host.textContent).toBe("none");
    await userStore.actions.loadUser();
    expect(host.textContent).toBe("D");
  });

  it("store.use() без селектора отдаёт весь state", () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "5", name: "E" }));

    function Debug() {
      const state = userStore.use();
      return <p>{state().loading ? "loading" : "idle"}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Debug />, host);

    expect(host.textContent).toBe("idle");
  });
});

describe("createActionStore — третий аргумент selectorsFactory (кейс variantsByTag)", () => {
  function createTaggedStore(fetchUser: () => Promise<User>) {
    return createActionStore<
      UserState,
      { setUser(user: User): void; loadUser(): Promise<void> },
      { greeting(state: UserState): string; isReady(state: UserState): boolean }
    >(
      { user: null, loading: false },
      ({ setState }) => ({
        setUser(user: User) {
          setState((state) => ({ ...state, user }));
        },
        async loadUser() {
          setState((state) => ({ ...state, loading: true }));
          const user = await fetchUser();
          setState((state) => ({ ...state, user, loading: false }));
        },
      }),
      () => ({
        greeting(state) {
          return state.user === null ? "гость" : `привет, ${state.user.name}`;
        },
        isReady(state) {
          return state.user !== null && !state.loading;
        },
      }),
    );
  }

  it("selectors — готовые реактивные аксессоры сразу после создания стора, без .use() в компоненте", () => {
    const store = createTaggedStore(() => Promise.resolve({ id: "1", name: "A" }));

    expect(store.selectors.greeting()).toBe("гость");
    store.actions.setUser({ id: "1", name: "A" });
    expect(store.selectors.greeting()).toBe("привет, A");
  });

  it("несколько селекторов независимо следят за своей частью state", async () => {
    const store = createTaggedStore(() => Promise.resolve({ id: "2", name: "B" }));

    expect(store.selectors.isReady()).toBe(false);
    await store.actions.loadUser();
    expect(store.selectors.isReady()).toBe(true);
    expect(store.selectors.greeting()).toBe("привет, B");
  });

  it("селектор реактивен в реальном компоненте — DemoStand-кейс componentStore.selectors.variantsByTag()", async () => {
    const store = createTaggedStore(() => Promise.resolve({ id: "3", name: "C" }));

    function Greeting() {
      return <p>{store.selectors.greeting()}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Greeting />, host);

    expect(host.textContent).toBe("гость");
    await store.actions.loadUser();
    expect(host.textContent).toBe("привет, C");
  });
});

describe("createActionStoreFamily (кейс componentManagerStore — feedData по компоненту)", () => {
  interface FeedState {
    readonly feedData?: unknown;
  }

  function createFeedStoreOf() {
    return createActionStoreFamily<FeedState, { setFeedData(value: unknown): void }>({}, ({ setState }) => ({
      setFeedData(value) {
        setState((state) => ({ ...state, feedData: value }));
      },
    }));
  }

  it("разные ключи — физически разные store, запись в один не видна в другом", () => {
    const feedStoreOf = createFeedStoreOf();

    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    feedStoreOf("checkbox").actions.setFeedData({ checked: true });

    expect(feedStoreOf("button").get()).toEqual({ feedData: { label: "Кнопка" } });
    expect(feedStoreOf("checkbox").get()).toEqual({ feedData: { checked: true } });
  });

  it("повторный вызов с тем же ключом отдаёт тот же инстанс (кэш, не пересоздание)", () => {
    const feedStoreOf = createFeedStoreOf();

    const first = feedStoreOf("button");
    first.actions.setFeedData({ label: "Кнопка" });

    const second = feedStoreOf("button");
    expect(second).toBe(first);
    expect(second.get()).toEqual({ feedData: { label: "Кнопка" } });
  });

  it("переключение между компонентами в реальном рендере не путает feedData (баг из заявки)", () => {
    const feedStoreOf = createFeedStoreOf();

    function Feed(props: { component: string }) {
      return <p>{JSON.stringify(feedStoreOf(props.component).use((state) => state.feedData)())}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);

    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    feedStoreOf("checkbox").actions.setFeedData({ checked: true });

    dispose = render(() => <Feed component="button" />, host);
    expect(host.textContent).toBe(JSON.stringify({ label: "Кнопка" }));

    dispose?.();
    dispose = render(() => <Feed component="checkbox" />, host);
    expect(host.textContent).toBe(JSON.stringify({ checked: true }));
  });

  it("с selectorsFactory — тот же третий аргумент, что у createActionStore", () => {
    const feedStoreOf = createActionStoreFamily<
      FeedState,
      { setFeedData(value: unknown): void },
      { hasData(state: FeedState): boolean }
    >(
      {},
      ({ setState }) => ({
        setFeedData(value) {
          setState((state) => ({ ...state, feedData: value }));
        },
      }),
      () => ({
        hasData(state) {
          return state.feedData !== undefined;
        },
      }),
    );

    expect(feedStoreOf("button").selectors.hasData()).toBe(false);
    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    expect(feedStoreOf("button").selectors.hasData()).toBe(true);
    expect(feedStoreOf("checkbox").selectors.hasData()).toBe(false);
  });
});

describe("createActionStoreFamily — ключ аксессором (кейс apps/studio: ключ из маршрута)", () => {
  interface FeedState {
    readonly feedData?: unknown;
  }

  function createFeedStoreOf() {
    return createActionStoreFamily<FeedState, { setFeedData(value: unknown): void }>({}, ({ setState }) => ({
      setFeedData(value) {
        setState((state) => ({ ...state, feedData: value }));
      },
    }));
  }

  it("подписка переезжает на стор нового ключа, поддерево не пересоздаётся", () => {
    const feedStoreOf = createFeedStoreOf();
    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    feedStoreOf("checkbox").actions.setFeedData({ checked: true });

    const [component, setComponent] = createSignal("button");
    let built = 0;

    function Feed() {
      built += 1;
      const store = feedStoreOf(component); // аксессор, а не значение
      const feedData = store.use((state) => state.feedData);
      return <p>{JSON.stringify(feedData())}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Feed />, host);

    expect(host.textContent).toBe(JSON.stringify({ label: "Кнопка" }));

    setComponent("checkbox");
    expect(host.textContent).toBe(JSON.stringify({ checked: true }));
    expect(built).toBe(1); // тело компонента отработало один раз — ремаунта не было
  });

  it("состояние прежнего ключа переезд не трогает", () => {
    const feedStoreOf = createFeedStoreOf();
    const [component, setComponent] = createSignal("button");

    const store = feedStoreOf(component);
    store.actions.setFeedData({ label: "Кнопка" });

    setComponent("checkbox");
    expect(store.get()).toEqual({}); // у чекбокса своё, пустое
    store.actions.setFeedData({ checked: true });

    setComponent("button");
    expect(store.get()).toEqual({ feedData: { label: "Кнопка" } });
    expect(feedStoreOf("checkbox").get()).toEqual({ feedData: { checked: true } });
  });

  it("actions и selectors адресуют стор текущего ключа", () => {
    const feedStoreOf = createActionStoreFamily<
      FeedState,
      { setFeedData(value: unknown): void },
      { hasData(state: FeedState): boolean }
    >(
      {},
      ({ setState }) => ({
        setFeedData(value) {
          setState((state) => ({ ...state, feedData: value }));
        },
      }),
      () => ({
        hasData(state) {
          return state.feedData !== undefined;
        },
      }),
    );

    const [component, setComponent] = createSignal("button");
    const store = feedStoreOf(component);

    store.actions.setFeedData({ label: "Кнопка" });
    expect(store.selectors.hasData()).toBe(true);

    setComponent("checkbox");
    expect(store.selectors.hasData()).toBe(false);
    expect(feedStoreOf("button").get()).toEqual({ feedData: { label: "Кнопка" } });
  });

  it("ключ значением работает как раньше — на смену сигнала такой стор не реагирует", () => {
    const feedStoreOf = createFeedStoreOf();
    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    feedStoreOf("checkbox").actions.setFeedData({ checked: true });

    const [component, setComponent] = createSignal("button");

    function Feed() {
      const feedData = feedStoreOf(component()).use((state) => state.feedData); // значение, не аксессор
      return <p>{JSON.stringify(feedData())}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Feed />, host);

    expect(host.textContent).toBe(JSON.stringify({ label: "Кнопка" }));
    setComponent("checkbox");
    expect(host.textContent).toBe(JSON.stringify({ label: "Кнопка" })); // так и задумано
  });

  it("после переезда прежний ключ читателя больше не дёргает", () => {
    const feedStoreOf = createFeedStoreOf();
    const [component, setComponent] = createSignal("button");
    let reads = 0;

    function Feed() {
      const feedData = feedStoreOf(component).use((state) => {
        reads += 1;
        return state.feedData;
      });
      return <p>{JSON.stringify(feedData())}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Feed />, host);

    setComponent("checkbox");
    const before = reads;

    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    expect(reads).toBe(before); // подписка уехала, на старом ключе читателя нет
    expect(host.textContent).toBe(""); // у чекбокса данных нет — JSON.stringify(undefined)
  });

  it("размонтирование читателя снимает подписку на стор текущего ключа", () => {
    const feedStoreOf = createFeedStoreOf();
    const [component] = createSignal("button");
    let reads = 0;

    function Feed() {
      const feedData = feedStoreOf(component).use((state) => {
        reads += 1;
        return state.feedData;
      });
      return <p>{JSON.stringify(feedData())}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    render(() => <Feed />, host)();

    const before = reads;
    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    expect(reads).toBe(before);
  });
});

describe("createActionStoreFamily — начальное значение функцией ключа", () => {
  interface CellState {
    readonly title: string;
    readonly tags: string[];
  }

  function createCellStoreOf() {
    return createActionStoreFamily<CellState, { addTag(tag: string): void }, string>(
      (key) => ({ title: key === undefined ? "нет ячейки" : `паспорт ${key}`, tags: [] }),
      ({ setState }) => ({
        addTag(tag) {
          setState((state) => ({ ...state, tags: [...state.tags, tag] }));
        },
      }),
    );
  }

  it("каждая ячейка при рождении несёт то, что посчитано из её ключа", () => {
    const cellStoreOf = createCellStoreOf();

    expect(cellStoreOf("button").get().title).toBe("паспорт button");
    expect(cellStoreOf("checkbox").get().title).toBe("паспорт checkbox");
  });

  it("объект начального значения не общий по ссылке — у каждой ячейки свой", () => {
    const cellStoreOf = createCellStoreOf();

    cellStoreOf("button").actions.addTag("форма");
    expect(cellStoreOf("button").get().tags).toEqual(["форма"]);
    expect(cellStoreOf("checkbox").get().tags).toEqual([]);
    expect(cellStoreOf("checkbox").get()).not.toBe(cellStoreOf("button").get());
  });

  it("форма-значение работает как раньше", () => {
    const cellStoreOf = createActionStoreFamily<CellState, { addTag(tag: string): void }, string>(
      { title: "общий", tags: [] },
      ({ setState }) => ({
        addTag(tag) {
          setState((state) => ({ ...state, tags: [...state.tags, tag] }));
        },
      }),
    );

    expect(cellStoreOf("button").get().title).toBe("общий");
    expect(cellStoreOf("checkbox").get().title).toBe("общий");
  });

  it("дефолтной ячейке начальное значение считается от ключа undefined", () => {
    const cellStoreOf = createCellStoreOf();

    expect(cellStoreOf.active().get().title).toBe("нет ячейки");
  });
});

describe("createActionStoreFamily — активный ключ (кейс apps/studio: имя приходит со сменой маршрута)", () => {
  interface FeedState {
    readonly feedData?: unknown;
  }

  function createFeedStoreOf() {
    return createActionStoreFamily<FeedState, { setFeedData(value: unknown): void }>({}, ({ setState }) => ({
      setFeedData(value) {
        setState((state) => ({ ...state, feedData: value }));
      },
    }));
  }

  it("до первой активации active() отдаёт дефолтную ячейку со статусом absent", () => {
    const feedStoreOf = createFeedStoreOf();
    const store = feedStoreOf.active();

    expect(store.key()).toBeUndefined();
    expect(store.status()).toBe("absent");
    expect(store.get()).toEqual({});
  });

  it("запись в дефолтную ячейку заглушена — состояние остаётся начальным", () => {
    const feedStoreOf = createFeedStoreOf();
    const store = feedStoreOf.active();

    store.actions.setFeedData({ label: "Кнопка" });

    expect(store.get()).toEqual({});
    expect(store.status()).toBe("absent");
  });

  it("storeOf(undefined) значением — та же дефолтная ячейка, тоже без записи", () => {
    const feedStoreOf = createFeedStoreOf();

    const first = feedStoreOf(undefined);
    first.actions.setFeedData({ label: "Кнопка" });

    expect(feedStoreOf(undefined)).toBe(first);
    expect(first.get()).toEqual({});
  });

  it("activate переводит active() на ячейку ключа, записи туда доходят", () => {
    const feedStoreOf = createFeedStoreOf();
    const store = feedStoreOf.active();

    feedStoreOf.activate("button");

    expect(store.key()).toBe("button");
    expect(store.status()).toBe("initial");

    store.actions.setFeedData({ label: "Кнопка" });

    expect(store.status()).toBe("written");
    expect(feedStoreOf("button").get()).toEqual({ feedData: { label: "Кнопка" } });
  });

  it("смена активного ключа не трогает состояние прежнего", () => {
    const feedStoreOf = createFeedStoreOf();
    const store = feedStoreOf.active();

    feedStoreOf.activate("button");
    store.actions.setFeedData({ label: "Кнопка" });

    feedStoreOf.activate("checkbox");
    expect(store.get()).toEqual({});
    store.actions.setFeedData({ checked: true });

    feedStoreOf.activate("button");
    expect(store.get()).toEqual({ feedData: { label: "Кнопка" } });
    expect(feedStoreOf("checkbox").get()).toEqual({ feedData: { checked: true } });
  });

  it("active() отдаёт один и тот же стор — читателям не нужно знать имя", () => {
    const feedStoreOf = createFeedStoreOf();

    expect(feedStoreOf.active()).toBe(feedStoreOf.active());
  });

  it("в реальном рендере активация меняет данные без пересоздания поддерева", () => {
    const feedStoreOf = createFeedStoreOf();
    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    feedStoreOf("checkbox").actions.setFeedData({ checked: true });

    let built = 0;

    function Feed() {
      built += 1;
      const store = feedStoreOf.active(); // имя компонента панели неизвестно вовсе
      const feedData = store.use((state) => state.feedData);
      return <p>{store.status()}:{JSON.stringify(feedData())}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Feed />, host);

    expect(host.textContent).toBe("absent:");

    feedStoreOf.activate("button");
    expect(host.textContent).toBe(`written:${JSON.stringify({ label: "Кнопка" })}`);

    feedStoreOf.activate("checkbox");
    expect(host.textContent).toBe(`written:${JSON.stringify({ checked: true })}`);
    expect(built).toBe(1); // ремаунта не было
  });

  it("снятие активации возвращает к дефолтной ячейке", () => {
    const feedStoreOf = createFeedStoreOf();
    const store = feedStoreOf.active();

    feedStoreOf.activate("button");
    store.actions.setFeedData({ label: "Кнопка" });

    feedStoreOf.activate(undefined);
    expect(store.status()).toBe("absent");
    expect(store.get()).toEqual({});
    expect(feedStoreOf("button").get()).toEqual({ feedData: { label: "Кнопка" } });
  });

  it("status ячейки, адресованной значением: initial до записи, written после", () => {
    const feedStoreOf = createFeedStoreOf();
    const store = feedStoreOf("button");

    expect(store.key()).toBe("button");
    expect(store.status()).toBe("initial");

    store.actions.setFeedData({ label: "Кнопка" });
    expect(store.status()).toBe("written");
  });
});

describe("createActionStore — параметризованный селектор (кейс component-manager: значение по cell)", () => {
  interface GridState {
    readonly axis: "variant" | "assembly";
    readonly variants: readonly string[];
  }

  function createGridStore() {
    return createActionStore<
      GridState,
      { setAxis(axis: GridState["axis"]): void; setVariants(variants: readonly string[]): void },
      { variantAt(state: GridState, index: number): string | undefined }
    >(
      { axis: "variant", variants: [] },
      ({ setState }) => ({
        setAxis(axis) {
          setState((state) => ({ ...state, axis }));
        },
        setVariants(variants) {
          setState((state) => ({ ...state, variants }));
        },
      }),
      () => ({
        variantAt(state, index) {
          return state.axis === "variant" ? state.variants[index] : state.variants[0];
        },
      }),
    );
  }

  it("зовётся с аргументом и сразу отдаёт значение, без промежуточного `()`", () => {
    const store = createGridStore();
    store.actions.setVariants(["a", "b", "c"]);

    expect(store.selectors.variantAt(0)).toBe("a");
    expect(store.selectors.variantAt(2)).toBe("c");
  });

  it("реактивен для каждого аргумента независимо, в реальном рендере", () => {
    const store = createGridStore();
    store.actions.setVariants(["a", "b"]);

    function Cell(props: { index: number }) {
      return <p>{store.selectors.variantAt(props.index)}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <>
          <Cell index={0} />
          <Cell index={1} />
        </>
      ),
      host,
    );

    expect(host.textContent).toBe("ab");
    store.actions.setVariants(["x", "y"]);
    expect(host.textContent).toBe("xy");
  });

  function createCountingStore() {
    let calls = 0;
    const store = createActionStore<
      GridState,
      { setVariants(variants: readonly string[]): void },
      { variantAt(state: GridState, index: number): string | undefined }
    >(
      { axis: "variant", variants: ["a", "b"] },
      ({ setState }) => ({
        setVariants(variants) {
          setState((state) => ({ ...state, variants }));
        },
      }),
      () => ({
        variantAt(state, index) {
          calls += 1;
          return state.variants[index];
        },
      }),
    );

    return { store, calls: () => calls };
  }

  it("подписка гаснет, когда уходит последний читающий владелец", async () => {
    const { store, calls } = createCountingStore();

    function Cell() {
      return <p>{store.selectors.variantAt(0)}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    render(() => <Cell />, host)();

    await Promise.resolve(); // гашение корня отложено на микротаск — свойство createSingletonRoot

    const before = calls();
    store.actions.setVariants(["x", "y"]);
    expect(calls()).toBe(before); // живой подписки не осталось, пересчитывать некому
  });

  it("вызов без реактивного владельца не заводит подписку — разовое чтение снапшота", () => {
    const { store, calls } = createCountingStore();

    expect(store.selectors.variantAt(0)).toBe("a");

    const before = calls();
    store.actions.setVariants(["x", "y"]);
    expect(calls()).toBe(before);
    expect(store.selectors.variantAt(0)).toBe("x"); // значение свежее, хоть подписки и нет
  });

  it("axis влияет на результат так же, как обычный (беспараметровый) селектор видел бы state целиком", () => {
    const store = createGridStore();
    store.actions.setVariants(["a", "b", "c"]);

    expect(store.selectors.variantAt(1)).toBe("b");
    store.actions.setAxis("assembly");
    expect(store.selectors.variantAt(1)).toBe("a");
  });
});
