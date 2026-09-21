import { createGraphQLClient } from "@web-core/query/graphql";
import { render } from "@web-core/solid/web";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  connectPresets,
  dropPreset,
  loadPresets,
  presetsStore,
  savePreset,
} from "../../../src/entities/preset";
import { API_SHAPE } from "../../../src/entities/openapi";
import { ApiCatalog } from "../../../src/features/api-manager";
import { LIVE_URL, servicePresent } from "../../live";

const live = (await servicePresent()) ? describe : describe.skip;

const id = crypto.randomUUID();
const LABEL = `Живой каталог ${id.slice(0, 8)}`;

let dispose: (() => void) | undefined;

live("ApiCatalog на живой службе", () => {
  connectPresets(createGraphQLClient({ url: LIVE_URL }));

  beforeEach(() => {
    presetsStore.actions.hydrate([]);
  });

  afterAll(async () => {
    dispose?.();
    await dropPreset(id).catch(() => undefined);
    connectPresets(undefined);
  });

  it("показывает записи, которые лежат в службе, а не только здешние", async () => {
    await savePreset({
      id,
      kind: API_SHAPE.kind,
      label: LABEL,
      content: {
        endpoints: [
          { id: "e-1", method: "GET", url: "https://back/pets", groupId: "g-1", params: [] },
        ],
        groups: [{ id: "g-1", name: "питомцы" }],
        defs: {},
      },
    });
    presetsStore.actions.hydrate([]);

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <ApiCatalog />, host);

    await vi.waitFor(() => expect(host.textContent).toContain(LABEL), { timeout: 10_000 });

    expect(host.textContent).toContain("питомцы");
    expect(host.textContent).not.toContain("Службу прочитать не вышло");
    expect(presetsStore.selectors.presetBy(id)?.savedAt).toEqual(expect.any(String));
  });

  it("правка состава уезжает в службу и видна при перечитывании", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <ApiCatalog />, host);

    await vi.waitFor(() => expect(host.textContent).toContain(LABEL), { timeout: 10_000 });

    const groupsBefore = (presetsStore.selectors.presetBy(id)?.content as { groups: unknown[] })
      .groups.length;

    const plus = [...host.querySelectorAll<HTMLButtonElement>('button[aria-label="Добавить"]')];
    plus[0]?.click();

    await vi.waitFor(
      () =>
        expect(
          (presetsStore.selectors.presetBy(id)?.content as { groups: unknown[] }).groups,
        ).toHaveLength(groupsBefore + 1),
      { timeout: 10_000 },
    );

    await vi.waitFor(
      async () => {
        const fromService = (await loadPresets(API_SHAPE)).find((one) => one.id === id);
        expect((fromService?.content as { groups: unknown[] }).groups).toHaveLength(
          groupsBefore + 1,
        );
      },
      { timeout: 10_000 },
    );

    expect(host.textContent).not.toContain("Правка в службу не уехала");
  });
});
