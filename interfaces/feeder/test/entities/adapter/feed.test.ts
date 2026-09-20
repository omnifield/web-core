import { describe, expect, it } from "vitest";

import { feed, type Adapter } from "../../../src/entities/adapter";

function adapter(patch: Partial<Adapter> = {}): Adapter {
  return { root: "", rules: [], providers: {}, consumers: {}, ...patch };
}

const response = {
  meta: { title: "Курсы" },
  data: [
    { code: "USD", rate: 1 },
    { code: "EUR", rate: 1.1 },
  ],
};

describe("feed", () => {
  it("все записи ложатся в ОДИН массив потребителя, а не в N объектов", () => {
    const result = feed(
      response,
      adapter({
        root: "/data",
        rules: [
          { id: "r1", target: "/items/0/label", from: "/code" },
          { id: "r2", target: "/items/0/value", from: "/rate" },
        ],
      }),
    );

    expect(result.value).toEqual({
      items: [
        { label: "USD", value: 1 },
        { label: "EUR", value: 1.1 },
      ],
    });
  });

  it("цель вне массива — одно значение на весь объект, источник от корня ответа", () => {
    const result = feed(
      response,
      adapter({
        root: "/data",
        rules: [
          { id: "r0", target: "/title", from: "/meta/title" },
          { id: "r1", target: "/items/0/label", from: "/code" },
        ],
      }),
    );

    expect(result.value).toEqual({
      title: "Курсы",
      items: [{ label: "USD" }, { label: "EUR" }],
    });
  });

  it("без массивных целей собирается один объект, записи не нужны", () => {
    const result = feed(
      response,
      adapter({ rules: [{ id: "r0", target: "/header/text", from: "/meta/title" }] }),
    );

    expect(result.value).toEqual({ header: { text: "Курсы" } });
    expect(result.error).toBeNull();
  });

  it("отчёт считает обе стороны — и строки, и одиночные", () => {
    const result = feed(
      response,
      adapter({
        root: "/data",
        rules: [
          { id: "r0", target: "/title", from: "/meta/title" },
          { id: "r1", target: "/items/0/label", from: "/code" },
        ],
      }),
    );

    expect(result.report.total).toBe(3);
    expect(result.report.converted).toBe(3);
  });

  it("две коллекции в форме потребителя наполняются из тех же записей", () => {
    const result = feed(
      response,
      adapter({
        root: "/data",
        rules: [
          { id: "r1", target: "/items/0/label", from: "/code" },
          { id: "r2", target: "/legend/0/text", from: "/code" },
        ],
      }),
    );

    expect(result.value).toEqual({
      items: [{ label: "USD" }, { label: "EUR" }],
      legend: [{ text: "USD" }, { text: "EUR" }],
    });
  });

  it("корень мимо — ошибка названа, а не пустой объект молчком", () => {
    const result = feed(
      response,
      adapter({
        root: "/rows",
        rules: [{ id: "r1", target: "/items/0/label", from: "/code" }],
      }),
    );

    expect(result.error).toBe("по пути «/rows» набора записей нет");
  });
});
