import type { PathType } from "@web-core/io";
import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ADAPTER_KIND, asAdapter } from "../../../src/entities/adapter";
import { presetsStore } from "../../../src/entities/preset";
import { AdapterMastering } from "../../../src/features/adapter-manager";
import { dragTo } from "../../support/drag";

let dispose: (() => void) | undefined;

beforeEach(() => {
  presetsStore.actions.hydrate([]);
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

const output: PathType[] = [
  { path: "/title", type: "string" },
  { path: "/author/name", type: "string" },
];

const input: PathType[] = [{ path: "/login", type: "string" }];

const PROVIDER = ["api", "preset-7", "endpoint-3"];
const CONSUMER = ["component", "user-card"];

function mount(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(
    () => (
      <AdapterMastering
        provider={PROVIDER}
        consumer={CONSUMER}
        output={output}
        input={input}
      />
    ),
    host,
  );
  return host;
}

function columns(host: HTMLElement): [Element, Element] {
  return [
    host.querySelector('[data-block="output"]')!,
    host.querySelector('[data-block="input"]')!,
  ];
}

function items(column: Element): Element[] {
  return [...column.querySelectorAll("[data-type]")];
}

function saved() {
  const [preset] = presetsStore.selectors.presetsOf(ADAPTER_KIND);
  return preset === undefined ? undefined : { preset, adapter: asAdapter(preset.content) };
}

describe("AdapterMastering", () => {
  it("пока ничего не связали, записи на складе нет", () => {
    mount();

    expect(presetsStore.selectors.presetsOf(ADAPTER_KIND)).toEqual([]);
  });

  it("первая связь заводит запись и помнит обоих её пользователей", () => {
    const host = mount();
    const [slots, fields] = columns(host);

    dragTo(items(fields)[0], items(slots)[0]);

    const record = saved();

    expect(record?.adapter?.rules).toHaveLength(1);
    expect(record?.adapter?.rules[0]).toMatchObject({ target: "/title", from: "/login" });
    expect(record?.adapter?.providers).toEqual({ api: { "preset-7": { "endpoint-3": {} } } });
    expect(record?.adapter?.consumers).toEqual({ component: { "user-card": {} } });
  });

  it("вторая связь ложится в ту же запись, а не заводит новую", () => {
    const host = mount();
    const [slots, fields] = columns(host);

    dragTo(items(fields)[0], items(slots)[0]);
    dragTo(items(fields)[0], items(slots)[1]);

    expect(presetsStore.selectors.presetsOf(ADAPTER_KIND)).toHaveLength(1);
    expect(saved()?.adapter?.rules.map((rule) => rule.target)).toEqual(["/title", "/author/name"]);
  });

  it("готовая запись этой пары подхватывается, а не заводится заново", () => {
    presetsStore.actions.add(ADAPTER_KIND, "уже есть", {
      root: "",
      rules: [{ id: "r1", target: "/title", from: "/login" }],
      providers: { api: { "preset-7": { "endpoint-3": {} } } },
      consumers: { component: { "user-card": {} } },
    });

    const host = mount();
    const [slots] = columns(host);

    expect(items(slots)[0]?.textContent).toContain("/login");
    expect(presetsStore.selectors.presetsOf(ADAPTER_KIND)).toHaveLength(1);
  });

  it("чужая пара своей записью не считается", () => {
    presetsStore.actions.add(ADAPTER_KIND, "чужая", {
      root: "",
      rules: [{ id: "r1", target: "/title", from: "/login" }],
      providers: { api: { "preset-9": { "endpoint-1": {} } } },
      consumers: { component: { table: {} } },
    });

    const host = mount();
    const [slots, fields] = columns(host);

    expect(items(slots)[0]?.textContent).not.toContain("/login");

    dragTo(items(fields)[0], items(slots)[0]);

    expect(presetsStore.selectors.presetsOf(ADAPTER_KIND)).toHaveLength(2);
  });

  it("снятая связь уходит из записи", () => {
    const host = mount();
    const [slots, fields] = columns(host);

    dragTo(items(fields)[0], items(slots)[0]);
    slots.querySelector("button")!.click();

    expect(saved()?.adapter?.rules).toEqual([]);
  });
});
