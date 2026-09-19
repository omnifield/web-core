import { beforeEach, describe, expect, it } from "vitest";

import { presetsStore } from "../../../src/entities/preset";

interface Content {
  readonly endpoints: { readonly url: string }[];
  readonly defs: Record<string, unknown>;
}

function content(): Content {
  return {
    endpoints: [{ url: "/a" }, { url: "/b" }, { url: "/c" }],
    defs: { Pet: { type: "object" } },
  };
}

beforeEach(() => {
  presetsStore.actions.hydrate([]);
});

describe("presetsStore.edit", () => {
  it("правит содержимое на месте — склад в него не заглядывает", () => {
    const id = presetsStore.actions.add("Петстор", content());

    presetsStore.actions.edit<Content>(id, (draft) => {
      draft.endpoints.splice(1, 1);
    });

    const next = presetsStore.selectors.presetBy(id)?.content as Content;
    expect(next.endpoints.map((endpoint) => endpoint.url)).toEqual(["/a", "/c"]);
  });

  it("нетронутое сохраняет ССЫЛКУ — правка точечная, а не перезапись целого", () => {
    const id = presetsStore.actions.add("Петстор", content());
    const before = presetsStore.selectors.presetBy(id)?.content as Content;

    presetsStore.actions.edit<Content>(id, (draft) => {
      draft.endpoints.splice(1, 1);
    });

    const after = presetsStore.selectors.presetBy(id)?.content as Content;
    expect(after.endpoints[0]).toBe(before.endpoints[0]);
    expect(after.defs).toBe(before.defs);
  });

  it("две правки подряд складываются, а не затирают друг друга", () => {
    const id = presetsStore.actions.add("Петстор", content());

    presetsStore.actions.edit<Content>(id, (draft) => {
      draft.endpoints.splice(0, 1);
    });
    presetsStore.actions.edit<Content>(id, (draft) => {
      draft.endpoints.splice(0, 1);
    });

    const next = presetsStore.selectors.presetBy(id)?.content as Content;
    expect(next.endpoints.map((endpoint) => endpoint.url)).toEqual(["/c"]);
  });

  it("соседний пресет правка не задевает", () => {
    const mine = presetsStore.actions.add("Мой", content());
    const alien = presetsStore.actions.add("Чужой", content());
    const before = presetsStore.selectors.presetBy(alien)?.content;

    presetsStore.actions.edit<Content>(mine, (draft) => {
      draft.endpoints.splice(0, 1);
    });

    expect(presetsStore.selectors.presetBy(alien)?.content).toBe(before);
  });

  it("правка по несуществующему айди проходит молча", () => {
    presetsStore.actions.add("Петстор", content());

    presetsStore.actions.edit<Content>("нет-такого", (draft) => {
      draft.endpoints.splice(0, 1);
    });

    expect((presetsStore.get().presets[0]?.content as Content).endpoints).toHaveLength(3);
  });
});
