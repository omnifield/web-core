import type { PathType } from "@web-core/io";
import type { JSX } from "@web-core/solid";
import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InputFields, OutputSlots } from "../../../src/entities/adapter";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(element: () => JSX.Element): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(element, host);
  return host;
}

function rows(host: HTMLElement): HTMLElement[] {
  return [...host.querySelectorAll<HTMLElement>("[data-type]")];
}

describe("OutputSlots", () => {
  const paths: PathType[] = [
    { path: "/title", type: "string" },
    { path: "/author/name", type: "string" },
    { path: "/author/age", type: "number" },
  ];

  it("рисует слоты плоским списком — слот адресуется путём, а не местом в дереве", () => {
    const host = mount(() => <OutputSlots paths={paths} />);

    expect(rows(host).map((row) => row.getAttribute("data-type"))).toEqual([
      "string",
      "string",
      "number",
    ]);
    expect(rows(host).map((row) => row.getAttribute("title"))).toEqual([
      "/title",
      "/author/name",
      "/author/age",
    ]);
    expect(rows(host).map((row) => row.textContent)).toEqual([
      expect.stringContaining("title"),
      expect.stringContaining("name"),
      expect.stringContaining("age"),
    ]);
  });

  it("пустой слот зовёт заполнить себя, а не молчит", () => {
    const host = mount(() => <OutputSlots paths={paths} />);

    const [first] = rows(host);

    expect(first.textContent).toContain("перетащите поле");
    expect(first.hasAttribute("data-filled")).toBe(false);
  });

  it("заполненный слот называет источник и помечает себя заполненным", () => {
    const host = mount(() => (
      <OutputSlots paths={paths} rules={[{ target: "/author/name", from: "/data/0/login" }]} />
    ));

    const [empty, filled] = rows(host);

    expect(filled.textContent).toContain("/data/0/login");
    expect(filled.hasAttribute("data-filled")).toBe(true);
    expect(empty.hasAttribute("data-filled")).toBe(false);
  });

  it("крестик снимает связь именно того слота, на котором нажали", () => {
    const unlinked = vi.fn();
    const host = mount(() => (
      <OutputSlots
        paths={paths}
        rules={[{ target: "/author/name", from: "/data/0/login" }]}
        onUnlink={unlinked}
      />
    ));

    const button = rows(host)[1].querySelector("button")!;
    button.click();

    expect(unlinked.mock.calls).toEqual([["/author/name"]]);
  });

  it("без обработчика снятия крестика нет вовсе", () => {
    const host = mount(() => (
      <OutputSlots paths={paths} rules={[{ target: "/author/name", from: "/data/0/login" }]} />
    ));

    expect(rows(host)[1].querySelector("button")).toBeNull();
  });

  it("тип показан значком своей категории, а слово остаётся подсказкой", () => {
    const host = mount(() => <OutputSlots paths={paths} />);

    const marks = [...host.querySelectorAll<HTMLElement>("[data-mark]")];

    expect(marks.map((mark) => mark.getAttribute("title"))).toEqual([
      "string",
      "string",
      "number",
    ]);
    expect(marks.map((mark) => mark.getAttribute("data-mark"))).toEqual([
      "type-string",
      "type-string",
      "type-number",
    ]);
  });

  it("незнакомый тип честно назван незнакомым, а не покрашен наугад", () => {
    const host = mount(() => <OutputSlots paths={[{ path: "/loop", type: "recursive" }]} />);

    const mark = host.querySelector<HTMLElement>("[data-mark]")!;

    expect(mark.getAttribute("data-mark")).toBe("type-unknown");
    expect(mark.getAttribute("title")).toBe("recursive");
  });

  it("слот переносимым себя не объявляет — он принимает, а не отдаёт", () => {
    const host = mount(() => <OutputSlots paths={paths} />);

    expect(rows(host).map((row) => row.getAttribute("draggable"))).toEqual([null, null, null]);
  });

  it("пустой выход объясняет себя словами потребителя", () => {
    const host = mount(() => <OutputSlots paths={[]} empty="Паспорта нет" />);

    expect(host.textContent).toContain("Паспорта нет");
  });
});

describe("InputFields", () => {
  const paths: PathType[] = [
    { path: "/id", type: "number" },
    { path: "/user/login", type: "string" },
  ];

  it("рисует поля плоским списком с их типом", () => {
    const host = mount(() => <InputFields paths={paths} />);

    expect(rows(host).map((row) => row.getAttribute("title"))).toEqual(["/id", "/user/login"]);
    expect(rows(host).map((row) => row.getAttribute("data-type"))).toEqual(["number", "string"]);
  });

  it("поле объявляет себя переносимым", () => {
    const host = mount(() => <InputFields paths={paths} />);

    expect(rows(host).map((row) => row.getAttribute("draggable"))).toEqual(["true", "true"]);
  });

  it("пустой вход объясняет себя словами потребителя", () => {
    const host = mount(() => <InputFields paths={[]} empty="Ответа ещё не было" />);

    expect(host.textContent).toContain("Ответа ещё не было");
  });
});
