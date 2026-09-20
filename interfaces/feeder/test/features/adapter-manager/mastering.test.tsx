import type { FieldRef, FieldRule, PathType } from "@web-core/io";
import { createSignal } from "@web-core/solid";
import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Mastering } from "../../../src/features/adapter-manager";
import { dragTo } from "../../support/drag";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

const output: PathType[] = [
  { path: "/title", type: "string" },
  { path: "/author/name", type: "string" },
];

const input: PathType[] = [
  { path: "/name", type: "string" },
  { path: "/count", type: "number" },
];

function mount(props?: {
  rules?: readonly FieldRule[];
  onLink?: (link: { target: FieldRef; from: FieldRef }) => void;
  onUnlink?: (target: FieldRef) => void;
}): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => (
      <Mastering
        output={output}
        input={input}
        rules={props?.rules}
        onLink={props?.onLink}
        onUnlink={props?.onUnlink}
      />
    ),
    host,
  );
  return host;
}

function columns(host: HTMLElement): [Element, Element] {
  const slots = host.querySelector('[data-block="output"]')!;
  const fields = host.querySelector('[data-block="input"]')!;
  return [slots, fields];
}

function items(column: Element): Element[] {
  return [...column.querySelectorAll("[data-type]")];
}

describe("Mastering", () => {
  it("держит обе стороны разом — выход слева, вход справа", () => {
    const host = mount();

    const texts = columns(host).map((column) =>
      items(column).map((node) => node.textContent),
    );

    expect(texts).toEqual([
      [expect.stringContaining("/title"), expect.stringContaining("/author/name")],
      [expect.stringContaining("/name"), expect.stringContaining("/count")],
    ]);
  });

  it("поле, брошенное в слот, называет обе стороны связи", () => {
    const linked = vi.fn();
    const host = mount({ onLink: linked });
    const [slots, fields] = columns(host);

    dragTo(items(fields)[1], items(slots)[0]);

    expect(linked.mock.calls).toEqual([[{ target: "/title", from: "/count" }]]);
  });

  it("связь видна в слоте, когда хозяин состояния вернул её пропом", () => {
    const [rules, setRules] = createSignal<readonly FieldRule[]>([]);

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <Mastering
          output={output}
          input={input}
          rules={rules()}
          onLink={(link) => setRules((was) => [...was, link])}
        />
      ),
      host,
    );

    const [slots, fields] = columns(host);
    dragTo(items(fields)[0], items(slots)[1]);

    expect(items(slots)[1].hasAttribute("data-filled")).toBe(true);
    expect(items(slots)[1].textContent).toContain("/name");
    expect(items(slots)[0].hasAttribute("data-filled")).toBe(false);
  });

  it("связь снимается крестиком — наружу едет слот, который освободили", () => {
    const unlinked = vi.fn();
    const host = mount({
      rules: [{ target: "/author/name", from: "/name" }],
      onUnlink: unlinked,
    });
    const [slots] = columns(host);

    slots.querySelector("button")!.click();

    expect(unlinked.mock.calls).toEqual([["/author/name"]]);
  });
});
