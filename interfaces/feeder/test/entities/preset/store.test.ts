import { beforeEach, describe, expect, it } from "vitest";

import { presetsStore } from "../../../src/entities/preset";

beforeEach(() => {
  presetsStore.actions.hydrate([]);
});

describe("presetsStore", () => {
  it("хранит содержимое как есть и не заглядывает внутрь", () => {
    const raw = 'swagger: "2.0"\npaths: {}\n';
    const id = presetsStore.actions.add("api", "petstore.yaml", raw);

    expect(presetsStore.selectors.presetBy(id)?.content).toBe(raw);
  });

  it("две записи с одинаковым именем — разные записи, айди у каждой свой", () => {
    const first = presetsStore.actions.add("api", "swagger.json", "a");
    const second = presetsStore.actions.add("api", "swagger.json", "b");

    expect(first).not.toBe(second);
    expect(presetsStore.get().presets).toHaveLength(2);
    expect(presetsStore.selectors.presetBy(second)?.content).toBe("b");
  });

  it("переименование не трогает содержимое, подмена не трогает имя и вид", () => {
    const id = presetsStore.actions.add("api", "старое", "первый");

    presetsStore.actions.rename(id, "новое");
    expect(presetsStore.selectors.presetBy(id)).toEqual({
      id,
      kind: "api",
      name: "новое",
      content: "первый",
    });

    presetsStore.actions.replace(id, "второй");
    expect(presetsStore.selectors.presetBy(id)).toEqual({
      id,
      kind: "api",
      name: "новое",
      content: "второй",
    });
  });

  it("действие по несуществующему айди проходит молча, а не валит стор", () => {
    const id = presetsStore.actions.add("api", "одна", "a");

    presetsStore.actions.rename("нет-такого", "другое");
    presetsStore.actions.replace("нет-такого", "другое");
    presetsStore.actions.remove("нет-такого");

    expect(presetsStore.get().presets).toHaveLength(1);
    expect(presetsStore.selectors.presetBy(id)?.name).toBe("одна");
  });

  it("удаление убирает только свою запись", () => {
    const first = presetsStore.actions.add("api", "первая", "a");
    const second = presetsStore.actions.add("api", "вторая", "b");

    presetsStore.actions.remove(first);

    expect(presetsStore.selectors.presetBy(first)).toBeUndefined();
    expect(presetsStore.selectors.presetBy(second)?.name).toBe("вторая");
  });

  it("hydrate поднимает сохранённое снаружи целиком", () => {
    presetsStore.actions.add("api", "своя", "a");

    presetsStore.actions.hydrate([
      { id: "с-бэка", kind: "api", name: "поднятая", content: "b" },
    ]);

    expect(presetsStore.get().presets).toHaveLength(1);
    expect(presetsStore.selectors.presetBy("с-бэка")?.content).toBe("b");
  });

  it("вид записи ставит тот, кто её завёл, и склад его только запоминает", () => {
    const id = presetsStore.actions.add("adapter", "юзеры → таблица", { rules: [] });

    expect(presetsStore.selectors.presetBy(id)?.kind).toBe("adapter");
  });

  it("отбор по виду отдаёт только свои записи, в порядке склада", () => {
    presetsStore.actions.add("api", "первая схема", "a");
    presetsStore.actions.add("adapter", "адаптер", "b");
    presetsStore.actions.add("api", "вторая схема", "c");

    expect(presetsStore.selectors.presetsOf("api").map((preset) => preset.name)).toEqual([
      "первая схема",
      "вторая схема",
    ]);
    expect(presetsStore.selectors.presetsOf("adapter").map((preset) => preset.name)).toEqual([
      "адаптер",
    ]);
  });

  it("вида, которого нет на складе, — пустой отбор, а не отказ", () => {
    presetsStore.actions.add("api", "схема", "a");

    expect(presetsStore.selectors.presetsOf("чего-то-ещё")).toEqual([]);
  });
});
