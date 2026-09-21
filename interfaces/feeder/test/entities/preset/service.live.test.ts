import { createGraphQLClient } from "@web-core/query/graphql";
import { afterAll, describe, expect, it } from "vitest";

import {
  connectPresets,
  dropPreset,
  loadPresets,
  savePreset,
  type Preset,
} from "../../../src/entities/preset";
import { API_SHAPE } from "../../../src/entities/openapi";
import { LIVE_URL, servicePresent } from "../../live";

const live = (await servicePresent()) ? describe : describe.skip;

const id = crypto.randomUUID();

const document = {
  endpoints: [
    {
      id: "e-1",
      method: "GET",
      url: "https://back/users",
      groupId: "g-1",
      params: [],
    },
  ],
  groups: [{ id: "g-1", name: "юзеры" }],
  defs: {},
};

live("живая служба пресетов", () => {
  connectPresets(createGraphQLClient({ url: LIVE_URL }));

  afterAll(async () => {
    await dropPreset(id).catch(() => undefined);
    connectPresets(undefined);
  });

  it("заводит запись с нашим айди, читает её обратно и заменяет содержимое", async () => {
    const fresh: Preset = {
      id,
      kind: API_SHAPE.kind,
      label: "Живой прогон",
      content: document,
    };

    const saved = await savePreset(fresh);
    expect(saved.savedAt).toEqual(expect.any(String));

    const found = (await loadPresets(API_SHAPE)).find((one) => one.id === id);
    expect(found?.label).toBe("Живой прогон");
    expect(found?.content).toEqual(document);

    const again = await savePreset({
      ...saved,
      label: "Живой прогон, правка",
    });
    expect(again.savedAt).toEqual(expect.any(String));

    const reread = (await loadPresets(API_SHAPE)).find((one) => one.id === id);
    expect(reread?.label).toBe("Живой прогон, правка");
  });

  it("удаляет запись, и служба её больше не отдаёт", async () => {
    expect(await dropPreset(id)).toBe(true);

    const gone = (await loadPresets(API_SHAPE)).find((one) => one.id === id);
    expect(gone).toBeUndefined();
  });
});
