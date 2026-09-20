import { describe, expect, it } from "vitest";

import { defineUserKind, userKindOf, userKinds } from "../../../src/entities/adapter";
import { API_USER } from "../../../src/features/api-manager";

const COMPONENT_USER = defineUserKind("component", (name: string) => [name]);

describe("виды участника", () => {
  it("построитель сам ставит вид первым сегментом — руками собирать нечего", () => {
    expect(API_USER.path("preset-7", "endpoint-3")).toEqual([
      "api",
      "preset-7",
      "endpoint-3",
    ]);
    expect(COMPONENT_USER.path("user-card")).toEqual(["component", "user-card"]);
  });

  it("объявленное видно в реестре — список видов доступен снаружи", () => {
    expect(userKinds().map((one) => one.kind)).toEqual(
      expect.arrayContaining(["api", "component"]),
    );
  });

  it("по готовому пути узнаётся, чей он", () => {
    expect(userKindOf(API_USER.path("p", "e"))?.kind).toBe("api");
    expect(userKindOf(["component", "user-card"])?.kind).toBe("component");
  });

  it("незнакомый вид не выдаёт себя за объявленный", () => {
    expect(userKindOf(["components", "user-card"])).toBeUndefined();
    expect(userKindOf([])).toBeUndefined();
  });

  it("повторное объявление того же вида отдаёт прежний, а не заводит второй", () => {
    const again = defineUserKind("component", (name: string) => [name]);

    expect(again).toBe(COMPONENT_USER);
    expect(userKinds().filter((one) => one.kind === "component")).toHaveLength(1);
  });
});
