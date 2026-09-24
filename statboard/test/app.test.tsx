import { render } from "@web-core/solid/web";
import { afterEach, describe, expect, it } from "vitest";

import { App } from "../src/app";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("экран статборда", () => {
  it("рисует заголовок и кнопку кита", () => {
    dispose = render(() => <App />, document.body);

    expect(document.querySelector("h1")?.textContent).toBe("Statboard");
    expect(document.querySelector("button")).not.toBeNull();
  });

  it("считает нажатия", () => {
    dispose = render(() => <App />, document.body);

    const button = document.querySelector("button");
    expect(button?.textContent).toContain("0");

    button?.click();
    expect(button?.textContent).toContain("1");
  });
});
