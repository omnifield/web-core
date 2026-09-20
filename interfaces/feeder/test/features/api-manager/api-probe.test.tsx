import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { API_KIND } from "../../../src/entities/openapi";
import { presetsStore } from "../../../src/entities/preset";
import { ApiCatalog, ApiProbe } from "../../../src/features/api-manager";

let dispose: (() => void) | undefined;

const document_ = {
  endpoints: [
    { id: "e1", method: "GET", url: "https://back/users", groupId: "g1", params: [] },
  ],
  groups: [{ id: "g1", name: "users" }],
  defs: {},
};

beforeEach(() => {
  presetsStore.actions.hydrate([]);
  presetsStore.actions.add(API_KIND, "мой бэк", document_);
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(what: "probe" | "catalog" = "probe"): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => (what === "probe" ? <ApiProbe /> : <ApiCatalog />), host);
  return host;
}

function buttons(host: HTMLElement): string[] {
  return [...host.querySelectorAll("button")].map(
    (one) => one.getAttribute("aria-label") ?? one.textContent ?? "",
  );
}

describe("ApiProbe", () => {
  it("состав ручек показан — по нему и дёргают", () => {
    const host = mount();

    expect(host.textContent).toContain("мой бэк");
    expect(host.textContent).toContain("users");
  });

  it("правки состава нет: ни завести, ни убрать, ни настроить", () => {
    const labels = buttons(mount("probe"));

    expect(labels).not.toContain("Добавить");
    expect(labels).not.toContain("Убрать");
    expect(labels).not.toContain("Настроить");
  });

  it("а в обычном каталоге эти кнопки есть — иначе проверка выше ничего не значит", () => {
    const labels = buttons(mount("catalog"));

    expect(labels).toContain("Добавить");
    expect(labels).toContain("Убрать");
    expect(labels).toContain("Настроить");
  });
});
