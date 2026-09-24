import { describe, expect, it } from "@web-core/build/test";
import { render } from "@web-core/solid/web";

import { Counter } from "../src/counter";

describe("стенд-потребитель", () => {
  it("берёт API раннера из базы, а не своей зависимостью", () => {
    expect(typeof it).toBe("function");
  });

  it("рисует Solid-компонент — значит вендор разрешился без объявления у потребителя", () => {
    const host = document.createElement("div");
    document.body.append(host);
    render(() => <Counter />, host);

    const button = host.querySelector("[data-testid=counter]");
    expect(button?.textContent).toBe("0");
  });
});
