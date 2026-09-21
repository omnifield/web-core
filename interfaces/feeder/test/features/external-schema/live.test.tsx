import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createGraphQLClient } from "@web-core/query/graphql";
import { render } from "@web-core/solid/web";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  connectPresets,
  dropPreset,
  loadPresets,
  presetsStore,
} from "../../../src/entities/preset";
import { API_SHAPE } from "../../../src/entities/openapi";
import { ExternalSchemaLoader } from "../../../src/features/external-schema";
import { LIVE_URL, servicePresent } from "../../live";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(
  join(fixtureDir, "../../entities/openapi/fixtures/petstore.yaml"),
  "utf-8",
);

const live = (await servicePresent()) ? describe : describe.skip;

const LABEL = `Живая загрузка ${crypto.randomUUID().slice(0, 8)}`;

let dispose: (() => void) | undefined;

live("загрузка схемы в живую службу", () => {
  connectPresets(createGraphQLClient({ url: LIVE_URL }));

  beforeEach(() => {
    presetsStore.actions.hydrate([]);
  });

  afterAll(async () => {
    dispose?.();
    for (const record of await loadPresets(API_SHAPE)) {
      if (record.label === LABEL) await dropPreset(record.id);
    }
    connectPresets(undefined);
  });

  it("загруженный документ доезжает до службы и читается обратно уже оттуда", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <ExternalSchemaLoader />, host);

    const name = host.querySelector<HTMLInputElement>('[placeholder="Название пресета"]');
    const paste = host.querySelector<HTMLTextAreaElement>('[placeholder="PASTE"]');
    const button = [...host.querySelectorAll("button")].find((item) =>
      item.textContent?.includes("Загрузить схему"),
    );

    name!.value = LABEL;
    name!.dispatchEvent(new Event("input", { bubbles: true }));
    paste!.value = petstore;
    paste!.dispatchEvent(new Event("input", { bubbles: true }));
    button!.click();

    await vi.waitFor(
      () => expect(presetsStore.get().presets[0]?.savedAt).toEqual(expect.any(String)),
      { timeout: 10_000 },
    );

    expect(host.textContent).not.toContain("в службу не уехала");

    const fromService = (await loadPresets(API_SHAPE)).find((one) => one.label === LABEL);

    expect(fromService?.id).toBe(presetsStore.get().presets[0]?.id);
    expect((fromService?.content as { endpoints: unknown[] }).endpoints.length).toBeGreaterThan(0);
  });
});
