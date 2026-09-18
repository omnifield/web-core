import { describe, expect, it } from "vitest";

import {
  bindingBy,
  bindingKey,
  bindingStoreOf,
  isFed,
} from "../../../src/entities/binding";

const users = { apiId: "main", endpointId: "GET /users" };

describe("bindingStoreOf", () => {
  it("привязка заводится без правил — «привязано, но не сведено»", () => {
    const store = bindingStoreOf("Table");
    store.actions.bind(users);

    const binding = bindingBy(store.get(), bindingKey(users));
    expect(binding?.root).toBe("");
    expect(isFed(binding!)).toBe(false);
  });

  it("адаптер кладётся в ту же запись, что и привязка", () => {
    const store = bindingStoreOf("Table-rules");
    store.actions.bind(users);

    const id = bindingKey(users);
    store.actions.setRoot(id, "/data/items");
    store.actions.setRules(id, [{ target: "/label", from: "/name" }]);

    const binding = bindingBy(store.get(), id);
    expect(binding?.root).toBe("/data/items");
    expect(isFed(binding!)).toBe(true);
  });

  it("повторная привязка той же ручки меняет параметры вызова, но не сносит сведённые поля", () => {
    const store = bindingStoreOf("Table-again");
    store.actions.bind(users);
    const id = bindingKey(users);
    store.actions.setRules(id, [{ target: "/label", from: "/name" }]);

    store.actions.bind({ ...users, value: { limit: 10 } });

    expect(store.get().bindings).toHaveLength(1);
    expect(bindingBy(store.get(), id)?.source.value).toEqual({ limit: 10 });
    expect(bindingBy(store.get(), id)?.rules).toHaveLength(1);
  });

  it("одна ручка на два компонента — правила у каждого свои", () => {
    const table = bindingStoreOf("Table-shared");
    const list = bindingStoreOf("ListBox-shared");
    const id = bindingKey(users);

    table.actions.bind(users);
    list.actions.bind(users);
    table.actions.setRules(id, [{ target: "/label", from: "/name" }]);
    list.actions.setRules(id, [
      { target: "/value", from: "/id" },
      { target: "/text", from: "/name" },
    ]);

    expect(bindingBy(table.get(), id)?.rules).toHaveLength(1);
    expect(bindingBy(list.get(), id)?.rules).toHaveLength(2);
  });

  it("отвязка убирает только свою запись", () => {
    const store = bindingStoreOf("Table-unbind");
    const orders = { apiId: "main", endpointId: "GET /orders" };
    store.actions.bind(users);
    store.actions.bind(orders);

    store.actions.unbind(bindingKey(users));

    expect(store.get().bindings.map((binding) => binding.source.endpointId)).toEqual(["GET /orders"]);
  });

  it("hydrate поднимает сохранённые снаружи привязки целиком", () => {
    const store = bindingStoreOf("Table-hydrate");
    store.actions.hydrate([
      { source: users, root: "/data", rules: [{ target: "/label", from: "/name" }] },
    ]);

    expect(store.get().bindings).toHaveLength(1);
    expect(bindingBy(store.get(), bindingKey(users))?.root).toBe("/data");
  });
});
