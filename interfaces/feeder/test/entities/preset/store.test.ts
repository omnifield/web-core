import { beforeEach, describe, expect, it } from "vitest";

import { presetNamed, PRESET_NAME, presetsStore } from "../../../src/entities/preset";

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

  it("заведённая запись несёт человеческое имя и ещё не несёт машинного", () => {
    const id = presetsStore.actions.add("api", "мой бэк", "a");

    expect(presetsStore.selectors.presetBy(id)).toEqual({
      id,
      kind: "api",
      label: "мой бэк",
      content: "a",
    });
  });

  it("переименование не трогает содержимое, подмена не трогает имя и вид", () => {
    const id = presetsStore.actions.add("api", "старое", "первый");

    presetsStore.actions.relabel(id, "новое");
    expect(presetsStore.selectors.presetBy(id)).toEqual({
      id,
      kind: "api",
      label: "новое",
      content: "первый",
    });

    presetsStore.actions.replace(id, "второй");
    expect(presetsStore.selectors.presetBy(id)).toEqual({
      id,
      kind: "api",
      label: "новое",
      content: "второй",
    });
  });

  it("машинное имя ставится отдельно от человеческого и его не трогает", () => {
    const id = presetsStore.actions.add("adapter", "user-card ← endpoint-3", { rules: [] });

    presetsStore.actions.rename(id, "users-list");

    expect(presetsStore.selectors.presetBy(id)?.name).toBe("users-list");
    expect(presetsStore.selectors.presetBy(id)?.label).toBe("user-card ← endpoint-3");
  });

  it("действие по несуществующему айди проходит молча, а не валит стор", () => {
    const id = presetsStore.actions.add("api", "одна", "a");

    presetsStore.actions.relabel("нет-такого", "другое");
    presetsStore.actions.rename("нет-такого", "другое");
    presetsStore.actions.replace("нет-такого", "другое");
    presetsStore.actions.remove("нет-такого");

    expect(presetsStore.get().presets).toHaveLength(1);
    expect(presetsStore.selectors.presetBy(id)?.label).toBe("одна");
  });

  it("удаление убирает только свою запись", () => {
    const first = presetsStore.actions.add("api", "первая", "a");
    const second = presetsStore.actions.add("api", "вторая", "b");

    presetsStore.actions.remove(first);

    expect(presetsStore.selectors.presetBy(first)).toBeUndefined();
    expect(presetsStore.selectors.presetBy(second)?.label).toBe("вторая");
  });

  it("hydrate поднимает сохранённое снаружи целиком", () => {
    presetsStore.actions.add("api", "своя", "a");

    presetsStore.actions.hydrate([
      { id: "с-бэка", kind: "api", label: "поднятая", content: "b" },
    ]);

    expect(presetsStore.get().presets).toHaveLength(1);
    expect(presetsStore.selectors.presetBy("с-бэка")?.content).toBe("b");
  });

  it("adopt подменяет запись с тем же айди и добавляет незнакомую", () => {
    const own = presetsStore.actions.add("api", "своя", "a");

    presetsStore.actions.adopt([
      { id: own, kind: "api", label: "она же со службы", savedAt: "когда-то", content: "b" },
      { id: "чужая", kind: "api", label: "новая со службы", savedAt: "когда-то", content: "c" },
    ]);

    expect(presetsStore.get().presets).toHaveLength(2);
    expect(presetsStore.selectors.presetBy(own)?.label).toBe("она же со службы");
    expect(presetsStore.selectors.presetBy(own)?.content).toBe("b");
    expect(presetsStore.selectors.presetBy("чужая")?.savedAt).toBe("когда-то");
  });

  it("adopt не трогает записи, которых в привозе не было", () => {
    const local = presetsStore.actions.add("api", "только моя", "a");

    presetsStore.actions.adopt([
      { id: "со-службы", kind: "api", label: "со службы", content: "b" },
    ]);

    expect(presetsStore.selectors.presetBy(local)?.label).toBe("только моя");
    expect(presetsStore.selectors.presetBy(local)?.savedAt).toBeUndefined();
  });

  it("вид записи ставит тот, кто её завёл, и склад его только запоминает", () => {
    const id = presetsStore.actions.add("adapter", "юзеры → таблица", { rules: [] });

    expect(presetsStore.selectors.presetBy(id)?.kind).toBe("adapter");
  });

  it("отбор по виду отдаёт только свои записи, в порядке склада", () => {
    presetsStore.actions.add("api", "первая схема", "a");
    presetsStore.actions.add("adapter", "адаптер", "b");
    presetsStore.actions.add("api", "вторая схема", "c");

    expect(presetsStore.selectors.presetsOf("api").map((preset) => preset.label)).toEqual([
      "первая схема",
      "вторая схема",
    ]);
    expect(presetsStore.selectors.presetsOf("adapter").map((preset) => preset.label)).toEqual([
      "адаптер",
    ]);
  });

  it("вида, которого нет на складе, — пустой отбор, а не отказ", () => {
    presetsStore.actions.add("api", "схема", "a");

    expect(presetsStore.selectors.presetsOf("чего-то-ещё")).toEqual([]);
  });
});

describe("машинное имя", () => {
  it("маска принимает строчную латиницу с дефисом и отвергает всё остальное", () => {
    expect(PRESET_NAME.safeParse("users-list").success).toBe(true);
    expect(PRESET_NAME.safeParse("a1").success).toBe(true);

    expect(PRESET_NAME.safeParse("Users").success).toBe(false);
    expect(PRESET_NAME.safeParse("users list").success).toBe(false);
    expect(PRESET_NAME.safeParse("-users").success).toBe(false);
    expect(PRESET_NAME.safeParse("").success).toBe(false);
    expect(PRESET_NAME.safeParse("u".repeat(33)).success).toBe(false);
  });

  it("отказ маски называется словами, а не кодом", () => {
    const failure = PRESET_NAME.safeParse("Users");

    expect(failure.error?.issues[0]?.message).toContain("латиница");
  });

  it("поиск по машинному имени идёт в пределах вида", () => {
    const adapter = presetsStore.actions.add("adapter", "карточка", { rules: [] });
    presetsStore.actions.rename(adapter, "user-card");

    const menu = presetsStore.actions.add("menu", "набор студии", { adapters: [] });
    presetsStore.actions.rename(menu, "user-card");

    expect(presetNamed("adapter", "user-card")?.id).toBe(adapter);
    expect(presetNamed("menu", "user-card")?.id).toBe(menu);
    expect(presetNamed("api", "user-card")).toBeUndefined();
  });

  it("записи без машинного имени поиску не отвечают", () => {
    presetsStore.actions.add("adapter", "безымянная", { rules: [] });

    expect(presetNamed("adapter", "")).toBeUndefined();
  });
});
