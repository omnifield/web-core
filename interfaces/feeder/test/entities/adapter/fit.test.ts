import { describe, expect, it } from "vitest";

import { fitOf } from "../../../src/entities/adapter";

describe("fitOf", () => {
  it("тот же тип ложится как есть", () => {
    expect(fitOf("string", "string")).toBe("exact");
    expect(fitOf("number", "number")).toBe("exact");
  });

  it("в строку кладётся что угодно известное — текст получится из любого скаляра", () => {
    expect(fitOf("number", "string")).toBe("safe");
    expect(fitOf("boolean", "string")).toBe("safe");
    expect(fitOf("enum", "string")).toBe("safe");
  });

  it("из строки в число и обратную сторону булева — с риском: значение может не разобраться", () => {
    expect(fitOf("string", "number")).toBe("risky");
    expect(fitOf("string", "boolean")).toBe("risky");
    expect(fitOf("number", "boolean")).toBe("risky");
  });

  it("неизвестный тип с обеих сторон — риск, а не запрет: мы про него ничего не знаем", () => {
    expect(fitOf("unknown", "string")).toBe("risky");
    expect(fitOf("string", "recursive")).toBe("risky");
    expect(fitOf("null", "number")).toBe("risky");
  });
});
