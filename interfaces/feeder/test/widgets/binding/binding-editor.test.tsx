import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { z } from "@web-core/io";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BindingEditor } from "../../../src/widgets/binding";

const fixtureDir = dirname(fileURLToPath(import.meta.url));
const petstore = readFileSync(
  join(fixtureDir, "../../entities/openapi/fixtures/petstore.yaml"),
  "utf-8",
);

const consumers = [{ name: "Table", input: z.object({ text: z.string() }) }];

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
});

describe("BindingEditor", () => {
  it("документ доезжает до списка ручек, на каждой — выбор потребителя", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <BindingEditor api="editor-api" consumers={consumers} raw={petstore} />,
      host,
    );

    await vi.waitFor(() =>
      expect(host.textContent).toContain("https://petstore.swagger.io/v2/pet/findByStatus"),
    );

    const options = [...host.querySelectorAll("select")].flatMap((select) =>
      [...select.options].map((option) => option.value),
    );
    expect(options).toContain("Table");
  });
});
