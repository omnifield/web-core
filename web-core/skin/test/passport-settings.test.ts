// Перечень имён настроек закрыт дважды — типом (`PassportSettings<Props>`) и рантайм-проверкой
// внутри `definePassport`. Здесь проверяется вторая половина: словарь расширяем, но не открыт.

import { createAnatomy } from "@zag-js/anatomy";
import { describe, expect, it } from "vitest";

import { definePassport, defineSettings, SETTINGS } from "../src/engine/passport/form/index.js";

const anatomy = createAnatomy("typography").parts("root");

function passportWith(settings: Parameters<typeof definePassport>[0]["settings"]) {
  return definePassport({
    anatomy,
    root: "root",
    parts: [{ name: "root", states: [] }],
    variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
    settings,
  });
}

describe("словарь имён настроек", () => {
  it("truncated — законное имя: флаг с атрибутной меткой проходит definePassport", () => {
    const passport = passportWith(
      defineSettings<{ truncated: boolean }>()({
        truncated: {
          values: { kind: "flag" },
          byDefault: false,
          mark: { kind: "attribute", name: "data-truncated" },
        },
      }),
    );

    expect(passport.settings.truncated?.values).toEqual({ kind: "flag" });
    expect(SETTINGS.truncated).toBe("Truncated");
  });

  it("имя вне словаря по-прежнему отбивается", () => {
    expect(() => passportWith({ clamped: { values: { kind: "flag" }, byDefault: false } })).toThrow(
      /settings outside the list: clamped/,
    );
  });
});
