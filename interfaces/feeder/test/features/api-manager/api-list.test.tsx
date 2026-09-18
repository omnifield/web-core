import { createSignal, type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { apiCatalogOf } from "../../../src/entities/openapi";
import { ApiList } from "../../../src/features/api-manager";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

function mount(ui: () => JSX.Element): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(ui, host);
  return host;
}

describe("ApiList", () => {
  it("показывает ручки того API, что назван пропом — без всякой обёртки", () => {
    apiCatalogOf("list-a").actions.addEndpoint({
      method: "GET",
      url: "https://a.test/users",
      params: [],
    });

    const host = mount(() => <ApiList api="list-a" />);

    expect(host.textContent).toContain("https://a.test/users");
  });

  it("каталоги разных API не смешиваются", () => {
    apiCatalogOf("list-mine").actions.addEndpoint({
      method: "GET",
      url: "https://mine.test/users",
      params: [],
    });
    apiCatalogOf("list-alien").actions.addEndpoint({
      method: "GET",
      url: "https://alien.test/orders",
      params: [],
    });

    const host = mount(() => <ApiList api="list-mine" />);

    expect(host.textContent).toContain("https://mine.test/users");
    expect(host.textContent).not.toContain("https://alien.test/orders");
  });

  it("смена `api` переводит список на другой каталог", () => {
    apiCatalogOf("list-first").actions.addEndpoint({
      method: "GET",
      url: "https://first.test/users",
      params: [],
    });
    apiCatalogOf("list-second").actions.addEndpoint({
      method: "POST",
      url: "https://second.test/orders",
      params: [],
    });

    const [api, setApi] = createSignal("list-first");
    const host = mount(() => <ApiList api={api()} />);
    expect(host.textContent).toContain("https://first.test/users");

    setApi("list-second");

    expect(host.textContent).toContain("https://second.test/orders");
    expect(host.textContent).not.toContain("https://first.test/users");
  });

  it("два API рядом на одном экране — каждый со своим составом", () => {
    apiCatalogOf("list-left").actions.addEndpoint({
      method: "GET",
      url: "https://left.test/users",
      params: [],
    });
    apiCatalogOf("list-right").actions.addEndpoint({
      method: "GET",
      url: "https://right.test/orders",
      params: [],
    });

    const host = mount(() => (
      <>
        <ApiList api="list-left" />
        <ApiList api="list-right" />
      </>
    ));

    expect(host.textContent).toContain("https://left.test/users");
    expect(host.textContent).toContain("https://right.test/orders");
  });

  it("пустой каталог объясняет себя словами, а не пустотой", () => {
    const host = mount(() => <ApiList api="list-empty" />);

    expect(host.textContent).toContain("Ручек пока нет");
  });
});
