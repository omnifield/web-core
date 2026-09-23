import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Entries, Key, keyArray, MapEntries, Rerun, SetValues } from "../src/keyed/index";

type Row = { id: string; label: string };

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("@web-core/solid/keyed", () => {
  it("Key держит узел за ключом, а не за ссылкой на элемент", () => {
    const [rows, setRows] = createSignal<Row[]>([
      { id: "a", label: "первый" },
      { id: "b", label: "второй" },
    ]);

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <Key each={rows()} by={(row: Row) => row.id}>
          {(row) => <p data-key={row().id}>{row().label}</p>}
        </Key>
      ),
      host,
    );

    const kept = host.querySelector('[data-key="a"]');
    expect(kept?.textContent).toBe("первый");

    setRows([
      { id: "a", label: "тот же ключ, другой объект" },
      { id: "b", label: "второй" },
    ]);

    expect(host.querySelector('[data-key="a"]')).toBe(kept);
    expect(kept?.textContent).toBe("тот же ключ, другой объект");
  });

  it("подпуть отдаёт весь состав вендора", () => {
    for (const exported of [Key, Entries, MapEntries, SetValues, Rerun, keyArray]) {
      expect(exported).toBeTypeOf("function");
    }
  });
});
