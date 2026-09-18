import { describe, expect, it } from "vitest";

import { applyAdapter, type Adapter } from "../../../src/entities/adapter";

const source = { apiId: "main", endpointId: "GET /users" };

function adapter(patch: Partial<Adapter> = {}): Adapter {
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

describe("applyAdapter", () => {
  it("набор записей по корню — каждая запись ложится на поля потребителя", () => {
    const response = { data: { items: [{ id: 1, name: "Аня" }, { id: 2, name: "Боря" }] } };

    const result = applyAdapter(response, adapter({ root: "/data/items" }));

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([
      { id: 1, label: "Аня" },
      { id: 2, label: "Боря" },
    ]);
    expect(result.report.converted).toBe(2);
  });

  it("массив в корне ответа — тот же путь, root пустой", () => {
    const result = applyAdapter([{ id: 7, name: "Вера" }], adapter());

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([{ id: 7, label: "Вера" }]);
  });

  it("одна запись (ручка «получить по айди») — тоже еда, не ошибка", () => {
    const result = applyAdapter({ id: 3, name: "Гена" }, adapter());

    expect(result.error).toBeNull();
    expect(result.rows).toEqual([{ id: 3, label: "Гена" }]);
  });

  it("привязка без правил — явный отказ, а не молчаливые ноль записей", () => {
    const result = applyAdapter([{ id: 1, name: "Аня" }], adapter({ rules: [] }));

    expect(result.rows).toEqual([]);
    expect(result.error).toMatch(/без адаптера/);
  });

  it("ручка ответила не той формой — отказ называет путь, на котором настраивали", () => {
    const result = applyAdapter({ payload: [] }, adapter({ root: "/data/items" }));

    expect(result.rows).toEqual([]);
    expect(result.error).toMatch(/\/data\/items/);
  });

  it("по пути привязки скаляр — записи из него не собрать", () => {
    const result = applyAdapter({ data: { items: 42 } }, adapter({ root: "/data/items" }));

    expect(result.rows).toEqual([]);
    expect(result.error).toMatch(/скаляр/);
  });

  it("поле, которого нет в записи, не роняет остальные — счёт беды виден в отчёте", () => {
    const response = [{ id: 1 }];

    const result = applyAdapter(response, adapter());

    expect(result.rows).toEqual([{ id: 1 }]);
    expect(result.report.issues.some((issue) => issue.target === "/label")).toBe(true);
  });
});
