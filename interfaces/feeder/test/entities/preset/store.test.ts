import { beforeEach, describe, expect, it } from "vitest";

import { presetsStore } from "../../../src/entities/preset";

beforeEach(() => {
  presetsStore.actions.hydrate([]);
});

describe("presetsStore", () => {
  it("хранит содержимое как есть и не заглядывает внутрь", () => {
    const raw = 'swagger: "2.0"\npaths: {}\n';
    const id = presetsStore.actions.add("petstore.yaml", raw);

    expect(presetsStore.selectors.presetBy(id)?.content).toBe(raw);
  });

  it("две записи с одинаковым именем — разные записи, айди у каждой свой", () => {
    const first = presetsStore.actions.add("swagger.json", "a");
    const second = presetsStore.actions.add("swagger.json", "b");

    expect(first).not.toBe(second);
    expect(presetsStore.get().presets).toHaveLength(2);
    expect(presetsStore.selectors.presetBy(second)?.content).toBe("b");
  });

  it("переименование не трогает содержимое, подмена не трогает имя", () => {
    const id = presetsStore.actions.add("старое", "первый");

    presetsStore.actions.rename(id, "новое");
    expect(presetsStore.selectors.presetBy(id)).toEqual({ id, name: "новое", content: "первый" });

    presetsStore.actions.replace(id, "второй");
    expect(presetsStore.selectors.presetBy(id)).toEqual({ id, name: "новое", content: "второй" });
  });

  it("действие по несуществующему айди проходит молча, а не валит стор", () => {
    const id = presetsStore.actions.add("одна", "a");

    presetsStore.actions.rename("нет-такого", "другое");
    presetsStore.actions.replace("нет-такого", "другое");
    presetsStore.actions.remove("нет-такого");

    expect(presetsStore.get().presets).toHaveLength(1);
    expect(presetsStore.selectors.presetBy(id)?.name).toBe("одна");
  });

  it("удаление убирает только свою запись", () => {
    const first = presetsStore.actions.add("первая", "a");
    const second = presetsStore.actions.add("вторая", "b");

    presetsStore.actions.remove(first);

    expect(presetsStore.selectors.presetBy(first)).toBeUndefined();
    expect(presetsStore.selectors.presetBy(second)?.name).toBe("вторая");
  });

  it("hydrate поднимает сохранённое снаружи целиком", () => {
    presetsStore.actions.add("своя", "a");

    presetsStore.actions.hydrate([{ id: "с-бэка", name: "поднятая", content: "b" }]);

    expect(presetsStore.get().presets).toHaveLength(1);
    expect(presetsStore.selectors.presetBy("с-бэка")?.content).toBe("b");
  });
});
