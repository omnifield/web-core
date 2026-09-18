import { describe, expect, it } from "vitest";

import {
  adapterBy,
  sourceKey,
  adapterStoreOf,
  isFed,
} from "../../../src/entities/adapter";

const users = { apiId: "main", endpointId: "GET /users" };

describe("adapterStoreOf", () => {
  it("привязка заводится без правил — «привязано, но не сведено»", () => {
    const store = adapterStoreOf("Table");
    store.actions.bind(users);

    const adapter = adapterBy(store.get(), sourceKey(users));
    expect(adapter?.root).toBe("");
    expect(isFed(adapter!)).toBe(false);
  });

  it("адаптер кладётся в ту же запись, что и привязка", () => {
    const store = adapterStoreOf("Table-rules");
    store.actions.bind(users);

    const id = sourceKey(users);
    store.actions.setRoot(id, "/data/items");
    store.actions.setRules(id, [{ target: "/label", from: "/name" }]);

    const adapter = adapterBy(store.get(), id);
    expect(adapter?.root).toBe("/data/items");
    expect(isFed(adapter!)).toBe(true);
  });

  it("повторная привязка той же ручки меняет параметры вызова, но не сносит сведённые поля", () => {
    const store = adapterStoreOf("Table-again");
    store.actions.bind(users);
    const id = sourceKey(users);
    store.actions.setRules(id, [{ target: "/label", from: "/name" }]);

    store.actions.bind({ ...users, value: { limit: 10 } });

    expect(store.get().adapters).toHaveLength(1);
    expect(adapterBy(store.get(), id)?.source.value).toEqual({ limit: 10 });
    expect(adapterBy(store.get(), id)?.rules).toHaveLength(1);
  });

  it("одна ручка на два компонента — правила у каждого свои", () => {
    const table = adapterStoreOf("Table-shared");
    const list = adapterStoreOf("ListBox-shared");
    const id = sourceKey(users);

    table.actions.bind(users);
    list.actions.bind(users);
    table.actions.setRules(id, [{ target: "/label", from: "/name" }]);
    list.actions.setRules(id, [
      { target: "/value", from: "/id" },
      { target: "/text", from: "/name" },
    ]);

    expect(adapterBy(table.get(), id)?.rules).toHaveLength(1);
    expect(adapterBy(list.get(), id)?.rules).toHaveLength(2);
  });

  it("отвязка убирает только свою запись", () => {
    const store = adapterStoreOf("Table-unbind");
    const orders = { apiId: "main", endpointId: "GET /orders" };
    store.actions.bind(users);
    store.actions.bind(orders);

    store.actions.unbind(sourceKey(users));

    expect(store.get().adapters.map((adapter) => adapter.source.endpointId)).toEqual(["GET /orders"]);
  });

  it("hydrate поднимает сохранённые снаружи привязки целиком", () => {
    const store = adapterStoreOf("Table-hydrate");
    store.actions.hydrate([
      { source: users, root: "/data", rules: [{ target: "/label", from: "/name" }] },
    ]);

    expect(store.get().adapters).toHaveLength(1);
    expect(adapterBy(store.get(), sourceKey(users))?.root).toBe("/data");
  });
});
