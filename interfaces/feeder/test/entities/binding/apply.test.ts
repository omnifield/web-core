import { describe, expect, it } from "vitest";

import { applyBinding, type Binding } from "../../../src/entities/binding";

const source = { apiId: "main", endpointId: "GET /users" };

function binding(patch: Partial<Binding> = {}): Binding {
  return {
    source,
    root: "",
    rules: [
      { target: "/id", from: "/id" },
      { target: "/label", from: "/name" },
    ],
    ...patch,
  };
}

describe("applyBinding", () => {
  it("набор записей по корню — каждая запись ложится на поля потребителя", () => {
    const response = { data: { items: [{ id: 1, name: "Аня" }, { id: 2, name: "Боря" }] } };

    const result = applyBinding(response, binding({ root: "/data/items" }));

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([
      { id: 1, label: "Аня" },
      { id: 2, label: "Боря" },
    ]);
    expect(result.report.converted).toBe(2);
  });

  it("массив в корне ответа — тот же путь, root пустой", () => {
    const result = applyBinding([{ id: 7, name: "Вера" }], binding());

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([{ id: 7, label: "Вера" }]);
  });

  it("одна запись (ручка «получить по айди») — тоже еда, не ошибка", () => {
    const result = applyBinding({ id: 3, name: "Гена" }, binding());

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([{ id: 3, label: "Гена" }]);
  });

  it("привязка без правил — явный отказ, а не молчаливые ноль записей", () => {
    const result = applyBinding([{ id: 1, name: "Аня" }], binding({ rules: [] }));

    expect(result.rows).toEqual([]);
    expect(result.error).toMatch(/без адаптера/);
  });

  it("ручка ответила не той формой — отказ называет путь, на котором настраивали", () => {
    const result = applyBinding({ payload: [] }, binding({ root: "/data/items" }));

    expect(result.rows).toEqual([]);
    expect(result.error).toMatch(/\/data\/items/);
  });

  it("по пути привязки скаляр — записи из него не собрать", () => {
    const result = applyBinding({ data: { items: 42 } }, binding({ root: "/data/items" }));

    expect(result.rows).toEqual([]);
    expect(result.error).toMatch(/скаляр/);
  });

  it("поле, которого нет в записи, не роняет остальные — счёт беды виден в отчёте", () => {
    const response = [{ id: 1 }];

    const result = applyBinding(response, binding());

    expect(result.rows).toEqual([{ id: 1 }]);
    expect(result.report.issues.some((issue) => issue.target === "/label")).toBe(true);
  });
});
