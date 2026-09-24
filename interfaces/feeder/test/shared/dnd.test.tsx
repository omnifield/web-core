import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { dragSource, dropTarget } from "../../src/shared";
import { dragTo } from "../support/drag";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(taken: (data: Record<string, unknown>) => void): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => (
      <>
        <span ref={(element: HTMLElement) => dragSource(element, () => ({ from: "/login" }))}>
          поле
        </span>
        <span ref={(element: HTMLElement) => dropTarget(element, { onDrop: taken })}>слот</span>
      </>
    ),
    host,
  );
  return host;
}

describe("перенос", () => {
  it("источник объявляет себя переносимым, цель — нет", () => {
    const host = mount(vi.fn());

    const [source, target] = [...host.querySelectorAll("span")];

    expect(source.getAttribute("draggable")).toBe("true");
    expect(target.getAttribute("draggable")).toBeNull();
  });

  it("цель получает данные источника, а не свои", () => {
    const taken = vi.fn();
    const host = mount(taken);
    const [source, target] = [...host.querySelectorAll("span")];

    dragTo(source, target);

    expect(taken.mock.calls).toEqual([[{ from: "/login" }]]);
  });

  it("снятие с монтажа убирает регистрацию источника", () => {
    const host = mount(vi.fn());
    const source = host.querySelector("span")!;

    dispose?.();
    dispose = undefined;

    expect(source.getAttribute("draggable")).toBeNull();
  });
});
