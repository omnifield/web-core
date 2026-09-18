import { beforeEach, describe, expect, it } from "vitest";

import { schemasStore } from "../../../src/entities/schema";

beforeEach(() => {
  schemasStore.actions.hydrate([]);
});

describe("schemasStore", () => {
  it("хранит оригинал документа как есть — ни разбора, ни нормализации", () => {
    const raw = 'swagger: "2.0"\npaths: {}\n';
    const id = schemasStore.actions.add("petstore.yaml", raw);

    expect(schemasStore.selectors.schemaBy(id)?.raw).toBe(raw);
  });

  it("две схемы с одинаковым именем — разные записи, айди у каждой свой", () => {
    const first = schemasStore.actions.add("swagger.json", "a");
    const second = schemasStore.actions.add("swagger.json", "b");

    expect(first).not.toBe(second);
    expect(schemasStore.get().schemas).toHaveLength(2);
    expect(schemasStore.selectors.schemaBy(second)?.raw).toBe("b");
  });

  it("переименование не трогает документ, перезалив не трогает имя", () => {
    const id = schemasStore.actions.add("старое", "первый");

    schemasStore.actions.rename(id, "новое");
    expect(schemasStore.selectors.schemaBy(id)).toEqual({ id, name: "новое", raw: "первый" });

    schemasStore.actions.replace(id, "второй");
    expect(schemasStore.selectors.schemaBy(id)).toEqual({ id, name: "новое", raw: "второй" });
  });

  it("действие по несуществующему айди проходит молча, а не валит стор", () => {
    const id = schemasStore.actions.add("одна", "a");

    schemasStore.actions.rename("нет-такого", "другое");
    schemasStore.actions.replace("нет-такого", "другое");
    schemasStore.actions.remove("нет-такого");

    expect(schemasStore.get().schemas).toHaveLength(1);
    expect(schemasStore.selectors.schemaBy(id)?.name).toBe("одна");
  });

  it("удаление убирает только свою запись", () => {
    const first = schemasStore.actions.add("первая", "a");
    const second = schemasStore.actions.add("вторая", "b");

    schemasStore.actions.remove(first);

    expect(schemasStore.selectors.schemaBy(first)).toBeUndefined();
    expect(schemasStore.selectors.schemaBy(second)?.name).toBe("вторая");
  });

  it("hydrate поднимает сохранённое снаружи целиком", () => {
    schemasStore.actions.add("своя", "a");

    schemasStore.actions.hydrate([{ id: "с-бэка", name: "поднятая", raw: "b" }]);

    expect(schemasStore.get().schemas).toHaveLength(1);
    expect(schemasStore.selectors.schemaBy("с-бэка")?.raw).toBe("b");
  });
});
