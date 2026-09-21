import type { PathType } from "@web-core/io";
import { createGraphQLClient } from "@web-core/query/graphql";
import { render } from "@web-core/solid/web";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { ADAPTER_KIND, ADAPTER_SHAPE } from "../../../src/entities/adapter";
import { connectPresets, dropPreset, loadPresets, presetsStore } from "../../../src/entities/preset";
import { AdapterMastering } from "../../../src/features/adapter-manager";
import { dragTo } from "../../support/drag";
import { LIVE_URL, servicePresent } from "../../live";

const live = (await servicePresent()) ? describe : describe.skip;

const mark = crypto.randomUUID().slice(0, 8);
const PROVIDER = ["api", `preset-${mark}`, `endpoint-${mark}`];
const CONSUMER = ["component", `card-${mark}`];

const output: PathType[] = [{ path: "/title", type: "string" }];
const input: PathType[] = [{ path: "/login", type: "string" }];

let dispose: (() => void) | undefined;

live("AdapterMastering на живой службе", () => {
  connectPresets(createGraphQLClient({ url: LIVE_URL }));

  beforeEach(() => {
    presetsStore.actions.hydrate([]);
  });

  afterAll(async () => {
    dispose?.();
    for (const record of await loadPresets(ADAPTER_SHAPE)) {
      if (record.label.includes(mark)) await dropPreset(record.id);
    }
    connectPresets(undefined);
  });

  it("связь, поставленная мышью, доезжает до службы и читается обратно", async () => {
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

    await vi.waitFor(() => expect(host.querySelector('[data-block="input"]')).not.toBeNull());

    const slots = host.querySelector('[data-block="output"]')!;
    const fields = host.querySelector('[data-block="input"]')!;

    dragTo(
      [...fields.querySelectorAll("[data-type]")][0],
      [...slots.querySelectorAll("[data-type]")][0],
    );

    await vi.waitFor(
      () =>
        expect(presetsStore.selectors.presetsOf(ADAPTER_KIND)[0]?.savedAt).toEqual(
          expect.any(String),
        ),
      { timeout: 10_000 },
    );

    expect(host.textContent).not.toContain("в службу не уехали");

    const fromService = (await loadPresets(ADAPTER_SHAPE)).find((one) =>
      one.label.includes(mark),
    );
    const content = fromService?.content as {
      rules: { target: string; from: string }[];
      providers: unknown;
    };

    expect(content.rules).toHaveLength(1);
    expect(content.rules[0]).toMatchObject({ target: "/title", from: "/login" });
    expect(content.providers).toEqual({
      api: { [`preset-${mark}`]: { [`endpoint-${mark}`]: {} } },
    });
  });
});
