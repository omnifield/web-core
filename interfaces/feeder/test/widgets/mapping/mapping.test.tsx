import { z } from "@web-core/io";
import type { FieldRule } from "@web-core/io";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Mapping, type MappingChange } from "../../../src/widgets/mapping";

const response = { data: { items: [{ id: 1, name: "Аня" }] } };
const target = z.object({ value: z.number(), text: z.string() });

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function mount(props: {
  root?: string;
  rules?: readonly FieldRule[];
  onChange: (change: MappingChange) => void;
}) {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => <Mapping source={response} target={target} {...props} />,
    host,
  );
  return host;
}

function selects(host: HTMLElement): HTMLSelectElement[] {
  return [...host.querySelectorAll("select")];
}

function pick(select: HTMLSelectElement, value: string) {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("Mapping", () => {
  it("на каждое поле потребителя — свой выбор пути из записи ответа", () => {
    const host = mount({ root: "/data/items", onChange: () => {} });

    // Первый select — «где записи», дальше по одному на поле потребителя.
    expect(selects(host)).toHaveLength(3);
    const options = [...selects(host)[1].options].map((option) => option.value);
    expect(options).toEqual(["", "/id", "/name"]);
  });

  it("пик пути отдаёт наружу правило, а не откладывает до кнопки", () => {
    const onChange = vi.fn();
    const host = mount({ root: "/data/items", onChange });

    pick(selects(host)[1], "/id");

    expect(onChange).toHaveBeenCalledWith({
      root: "/data/items",
      rules: [{ target: "/value", from: "/id" }],
    });
  });

  it("«не сведено» убирает правило этого поля и не трогает соседнее", () => {
    const onChange = vi.fn();
    const host = mount({
      root: "/data/items",
      rules: [
        { target: "/value", from: "/id" },
        { target: "/text", from: "/name" },
      ],
      onChange,
    });

    pick(selects(host)[1], "");

    expect(onChange).toHaveBeenCalledWith({
      root: "/data/items",
      rules: [{ target: "/text", from: "/name" }],
    });
  });

  it("смена набора записей уносит правила, которым больше некуда применяться", () => {
    const onChange = vi.fn();
    const host = mount({
      root: "/data/items",
      rules: [{ target: "/value", from: "/id" }],
      onChange,
    });

    pick(selects(host)[0], "");

    // В «весь ответ» пути записи другие (`/data/items/0/id`), старое правило применять некуда.
    expect(onChange).toHaveBeenCalledWith({ root: "", rules: [] });
  });

  it("уже сведённое поле показывает свой путь выбранным", () => {
    const host = mount({
      root: "/data/items",
      rules: [{ target: "/text", from: "/name" }],
      onChange: () => {},
    });

    expect(selects(host)[2].value).toBe("/name");
  });
});
