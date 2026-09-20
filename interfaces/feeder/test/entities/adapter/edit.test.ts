import { mutate, type Draft } from "@web-core/store/mutate";
import { describe, expect, it } from "vitest";

import { forgetUser, link, rememberUser, unlink, type Adapter } from "../../../src/entities/adapter";

const EMPTY: Adapter = { root: "", rules: [], providers: {}, consumers: {} };

function edit(adapter: Adapter, recipe: (draft: Draft<Adapter>) => void): Adapter {
  return mutate<Adapter>(recipe)(adapter);
}

describe("link", () => {
  it("первая связь рождается с выданным айди", () => {
    const after = edit(EMPTY, (draft) => { link(draft, "/label", "/name"); });

    expect(after.rules).toHaveLength(1);
    expect(after.rules[0]?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(after.rules[0]).toMatchObject({ target: "/label", from: "/name" });
  });

  it("второе поле в тот же слот меняет источник, а не плодит строку", () => {
    const one = edit(EMPTY, (draft) => { link(draft, "/label", "/name"); });
    const two = edit(one, (draft) => { link(draft, "/label", "/login"); });

    expect(two.rules).toHaveLength(1);
    expect(two.rules[0]?.from).toBe("/login");
  });

  it("строка при замене источника остаётся той же — айди не меняется", () => {
    const one = edit(EMPTY, (draft) => { link(draft, "/label", "/name"); });
    const two = edit(one, (draft) => { link(draft, "/label", "/login"); });

    expect(two.rules[0]?.id).toBe(one.rules[0]?.id);
  });

  it("разные слоты — разные связи", () => {
    const one = edit(EMPTY, (draft) => { link(draft, "/label", "/name"); });
    const two = edit(one, (draft) => { link(draft, "/title", "/name"); });

    expect(two.rules.map((rule) => rule.target)).toEqual(["/label", "/title"]);
  });
});

describe("unlink", () => {
  it("освобождает названный слот, соседей не трогает", () => {
    const filled = edit(EMPTY, (draft) => {
      link(draft, "/label", "/name");
      link(draft, "/title", "/head");
    });

    const after = edit(filled, (draft) => { unlink(draft, "/label"); });

    expect(after.rules.map((rule) => rule.target)).toEqual(["/title"]);
  });

  it("на пустом слоте молчит", () => {
    const after = edit(EMPTY, (draft) => { unlink(draft, "/label"); });

    expect(after.rules).toEqual([]);
  });
});

describe("rememberUser", () => {
  it("кладёт лист по адресу, достраивая ветку", () => {
    const after = edit(EMPTY, (draft) =>
      rememberUser(draft, "providers", ["api", "preset-7", "endpoint-3"]),
    );

    expect(after.providers).toEqual({ api: { "preset-7": { "endpoint-3": {} } } });
  });

  it("повторная запись того же адреса дубля не заводит", () => {
    const once = edit(EMPTY, (draft) => { rememberUser(draft, "providers", ["api", "p", "e"]); });
    const twice = edit(once, (draft) => { rememberUser(draft, "providers", ["api", "p", "e"]); });

    expect(twice.providers).toEqual({ api: { p: { e: {} } } });
  });

  it("роли разведены — поставщик не попадает к потребителям", () => {
    const after = edit(EMPTY, (draft) => {
      rememberUser(draft, "providers", ["api", "p", "e"]);
      rememberUser(draft, "consumers", ["component", "user-card"]);
    });

    expect(after.providers).toEqual({ api: { p: { e: {} } } });
    expect(after.consumers).toEqual({ component: { "user-card": {} } });
  });
});

describe("forgetUser", () => {
  it("убирает лист, ветку оставляет", () => {
    const filled = edit(EMPTY, (draft) => {
      rememberUser(draft, "providers", ["api", "p", "one"]);
      rememberUser(draft, "providers", ["api", "p", "two"]);
    });

    const after = edit(filled, (draft) => { forgetUser(draft, "providers", ["api", "p", "one"]); });

    expect(after.providers).toEqual({ api: { p: { two: {} } } });
  });
});
