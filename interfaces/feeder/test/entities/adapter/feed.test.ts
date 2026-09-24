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

describe("корень набора", () => {
  it("берётся из источника связи — человек уже показал его мышью", () => {
    const result = feed(
      response,
      adapter({
        rules: [
          { id: "r1", target: "/items/0/label", from: "/data/0/code" },
          { id: "r2", target: "/items/0/value", from: "/data/0/rate" },
        ],
      }),
    );

    expect(result.error).toBeNull();
    expect(result.value).toEqual({
      items: [
        { label: "USD", value: 1 },
        { label: "EUR", value: 1.1 },
      ],
    });
  });

  it("заданный на записи корень берётся, когда источник уже относителен записи", () => {
    const result = feed(
      { rows: [{ code: "USD" }], data: [{ code: "нет" }] },
      adapter({
        root: "/rows",
        rules: [{ id: "r1", target: "/items/0/label", from: "/code" }],
      }),
    );

    expect(result.value).toEqual({ items: [{ label: "USD" }] });
  });

  it("источник из чужого набора отбрасывается и при заданном корне", () => {
    const result = feed(
      { rows: [{ code: "USD" }], data: [{ code: "нет" }] },
      adapter({
        root: "/rows",
        rules: [{ id: "r1", target: "/items/0/label", from: "/data/0/code" }],
      }),
    );

    expect(result.value).toEqual({});
    expect(result.report.issues[0]?.reason).toContain("/data");
  });

  it("связь без индекса в источнике идёт мимо набора", () => {
    const result = feed(
      response,
      adapter({
        rules: [
          { id: "r0", target: "/title", from: "/meta/title" },
          { id: "r1", target: "/items/0/label", from: "/data/0/code" },
        ],
      }),
    );

    expect(result.value).toEqual({
      title: "Курсы",
      items: [{ label: "USD" }, { label: "EUR" }],
    });
  });

  it("чужой корень не проходит молча — поле остаётся пустым, а отчёт называет причину", () => {
    const result = feed(
      { data: [{ code: "USD" }], archived: [{ code: "SUR" }] },
      adapter({
        rules: [
          { id: "r1", target: "/items/0/label", from: "/data/0/code" },
          { id: "r2", target: "/items/0/old", from: "/archived/0/code" },
        ],
      }),
    );

    expect(result.value).toEqual({ items: [{ label: "USD" }] });
    expect(result.report.issues).toHaveLength(1);
    expect(result.report.issues[0]?.reason).toContain("/archived");
  });
});
