import type { PathType } from "@web-core/io";
import { render } from "@web-core/solid/web";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ADAPTER_KIND, asAdapter } from "../../../src/entities/adapter";
import { connectPresets, presetsStore, type PresetsService } from "../../../src/entities/preset";
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
  connectPresets(undefined);
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

describe("AdapterMastering и служба", () => {
  function serviceOf(answer: (document: string) => unknown): ReturnType<typeof vi.fn> {
    const request = vi.fn(async (document: string) => answer(document));
    connectPresets({ request } as unknown as PresetsService);
    return request;
  }

  function reading(presets: unknown[] = []) {
    return (document: string) => {
      if (document.includes("query Presets")) return { presets };
      if (document.includes("createPreset"))
        return { createPreset: { id: "неважно", savedAt: "первый раз" } };
      return { replacePreset: { id: "неважно", savedAt: "второй раз" } };
    };
  }

  it("первая связь уезжает в службу и запись помечается сохранённой", async () => {
    const request = serviceOf(reading());

    const host = mount();
    const [slots, fields] = columns(host);

    dragTo(items(fields)[0], items(slots)[0]);

    await vi.waitFor(() => expect(saved()?.preset.savedAt).toBe("первый раз"));

    const [document, variables] = request.mock.calls.at(-1) as [
      string,
      { input: { kind: string; state: { rules: unknown[] } } },
    ];
    expect(document).toContain("createPreset");
    expect(variables.input.kind).toBe(ADAPTER_KIND);
    expect(variables.input.state.rules).toHaveLength(1);
  });

  it("следующая связь уходит заменой той же записи, а не второй записью", async () => {
    const request = serviceOf(reading());

    const host = mount();
    const [slots, fields] = columns(host);

    dragTo(items(fields)[0], items(slots)[0]);
    await vi.waitFor(() => expect(saved()?.preset.savedAt).toBe("первый раз"));

    dragTo(items(fields)[0], items(slots)[1]);
    await vi.waitFor(() => expect(saved()?.preset.savedAt).toBe("второй раз"));

    expect(presetsStore.selectors.presetsOf(ADAPTER_KIND)).toHaveLength(1);
    expect((request.mock.calls.at(-1) as [string, unknown])[0]).toContain("replacePreset");
  });

  it("отказ службы назван словами, связь при этом остаётся на складе", async () => {
    serviceOf((document) => {
      if (document.includes("query Presets")) return { presets: [] };
      throw new Error("хранилище полно");
    });

    const host = mount();
    const [slots, fields] = columns(host);

    dragTo(items(fields)[0], items(slots)[0]);

    await vi.waitFor(() => expect(host.textContent).toContain("в службу не уехали"));
    expect(host.textContent).toContain("хранилище полно");
    expect(saved()?.adapter?.rules).toHaveLength(1);
    expect(saved()?.preset.savedAt).toBeUndefined();
  });

  it("адаптер пары, лежащий в службе, подхватывается, а не заводится вторым", async () => {
    serviceOf(
      reading([
        {
          id: "со-службы",
          label: "user-card ← endpoint-3",
          kind: ADAPTER_KIND,
          savedAt: "когда-то",
          root: "",
          rules: [{ id: "r-1", target: "/title", from: "/login" }],
          providers: { api: { "preset-7": { "endpoint-3": {} } } },
          consumers: { component: { "user-card": {} } },
        },
      ]),
    );

    const host = mount();

    await vi.waitFor(() =>
      expect(presetsStore.selectors.presetsOf(ADAPTER_KIND)).toHaveLength(1),
    );

    const [slots, fields] = columns(host);
    dragTo(items(fields)[0], items(slots)[1]);

    await vi.waitFor(() => expect(saved()?.adapter?.rules).toHaveLength(2));
    expect(presetsStore.selectors.presetsOf(ADAPTER_KIND)).toHaveLength(1);
    expect(saved()?.preset.id).toBe("со-службы");
  });
});

describe("AdapterMastering: имя записи и кнопка «Сохранить»", () => {
  function serviceOf(answer: (document: string) => unknown): ReturnType<typeof vi.fn> {
    const request = vi.fn(async (document: string) => answer(document));
    connectPresets({ request } as unknown as PresetsService);
    return request;
  }

  const answering = (document: string) => {
    if (document.includes("query Presets")) return { presets: [] };
    if (document.includes("createPreset"))
      return { createPreset: { id: "неважно", savedAt: "первый раз" } };
    return { replacePreset: { id: "неважно", savedAt: "после имени" } };
  };

  function nameField(host: HTMLElement): HTMLInputElement {
    return host.querySelector<HTMLInputElement>('[placeholder="Имя записи для ссылок"]')!;
  }

  function saveButton(host: HTMLElement): HTMLButtonElement {
    return [...host.querySelectorAll("button")].find((one) =>
      one.textContent?.includes("Сохранить"),
    )!;
  }

  function fill(host: HTMLElement, text: string): void {
    const field = nameField(host);
    field.value = text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }

  it("пока нечего сохранять, кнопка закрыта и сказано почему", () => {
    const host = mount();

    expect(saveButton(host).disabled).toBe(true);
    expect(host.textContent).toContain("сохранять пока нечего");
  });

  it("имя по кнопке садится на запись и уезжает в службу", async () => {
    const request = serviceOf(answering);

    const host = mount();
    const [slots, fields] = columns(host);
    dragTo(items(fields)[0], items(slots)[0]);

    await vi.waitFor(() => expect(saved()?.preset.savedAt).toBe("первый раз"));

    fill(host, "users-list");
    saveButton(host).click();

    await vi.waitFor(() => expect(saved()?.preset.savedAt).toBe("после имени"));
    expect(saved()?.preset.name).toBe("users-list");

    const [, variables] = request.mock.calls.at(-1) as [string, { input: { name?: string } }];
    expect(variables.input.name).toBe("users-list");
  });

  it("имя не по маске службы сохранять не даёт и называет причину", async () => {
    serviceOf(answering);

    const host = mount();
    const [slots, fields] = columns(host);
    dragTo(items(fields)[0], items(slots)[0]);
    await vi.waitFor(() => expect(saved()).toBeDefined());

    fill(host, "Users List");

    expect(saveButton(host).disabled).toBe(true);
    expect(host.textContent).toContain("латиница");
  });

  it("занятое имя того же вида названо занятым", async () => {
    serviceOf(answering);
    const other = presetsStore.actions.add(ADAPTER_KIND, "соседняя", {
      root: "",
      rules: [],
      providers: {},
      consumers: {},
    });
    presetsStore.actions.rename(other, "users-list");

    const host = mount();
    const [slots, fields] = columns(host);
    dragTo(items(fields)[0], items(slots)[0]);
    await vi.waitFor(() => expect(saved()).toBeDefined());

    fill(host, "users-list");

    expect(saveButton(host).disabled).toBe(true);
    expect(host.textContent).toContain("уже занято");
  });
});
