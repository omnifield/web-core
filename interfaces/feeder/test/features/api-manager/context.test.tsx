import { render } from "solid-js/web";
import { describe, expect, it } from "vitest";

import {
  ApiManagerProvider,
  useApiId,
  useApiCatalog,
} from "../../../src/features/api-manager";

function IdProbe() {
  return <div>{useApiId()}</div>;
}

describe("ApiManagerProvider", () => {
  it("отдаёт вниз айди своего API", () => {
    const host = document.createElement("div");
    const dispose = render(
      () => (
        <ApiManagerProvider api="main-back">
          <IdProbe />
        </ApiManagerProvider>
      ),
      host,
    );

    expect(host.textContent).toBe("main-back");
    dispose();
  });

  it("не рендерит детей, пока API не назван", () => {
    const host = document.createElement("div");
    const dispose = render(
      () => (
        <ApiManagerProvider api={undefined}>
          <div>дети</div>
        </ApiManagerProvider>
      ),
      host,
    );

    expect(host.textContent).toBe("");
    dispose();
  });

  it("useApiCatalog внутри провайдера — каталог ровно этого API", () => {
    const host = document.createElement("div");
    let stored: ReturnType<typeof useApiCatalog> | undefined;

    function StoreProbe() {
      stored = useApiCatalog();
      return null;
    }

    const dispose = render(
      () => (
        <ApiManagerProvider api="ctx-store">
          <StoreProbe />
        </ApiManagerProvider>
      ),
      host,
    );

    stored?.actions.addEndpoint({ method: "GET", url: "/ping", params: [] });
    expect(stored?.get().endpoints).toHaveLength(1);
    dispose();
  });

  it("вне провайдера useApiId — явная ошибка, а не тихий undefined", () => {
    expect(() => {
      const dispose = render(() => <IdProbe />, document.createElement("div"));
      dispose();
    }).toThrow(/ApiManagerProvider/);
  });
});
