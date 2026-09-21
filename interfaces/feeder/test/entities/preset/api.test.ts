import { ClientError } from "@web-core/query/graphql";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  connectPresets,
  dropPreset,
  failureOf,
  loadPresets,
  savePreset,
  type Preset,
  type PresetsService,
} from "../../../src/entities/preset";

const SHAPE = {
  kind: "тест-api",
  type: "Api",
  fields: ["endpoints", "groups", "defs"],
};

function serviceOf(answer: unknown): PresetsService & { request: ReturnType<typeof vi.fn> } {
  const request = vi.fn(async () => answer);
  const service = { request } as unknown as PresetsService & {
    request: ReturnType<typeof vi.fn>;
  };

  connectPresets(service);
  return service;
}

function askedWith(service: { request: ReturnType<typeof vi.fn> }): {
  document: string;
  variables: Record<string, unknown>;
} {
  const [document, variables] = service.request.mock.calls[0] as [string, Record<string, unknown>];
  return { document, variables };
}

afterEach(() => {
  connectPresets(undefined);
});

describe("чтение из службы", () => {
  it("спрашивает поля своего вида и отбирает записи по виду", async () => {
    const service = serviceOf({ presets: [] });

    await loadPresets(SHAPE);
    const asked = askedWith(service);

    expect(asked.document).toContain("... on Api");
    expect(asked.document).toContain("endpoints");
    expect(asked.document).toContain("defs");
    expect(asked.variables).toEqual({ kind: "тест-api" });
  });

  it("отбор по машинному имени уезжает отдельной переменной", async () => {
    const service = serviceOf({ presets: [] });

    await loadPresets(SHAPE, ["users-list"]);

    expect(askedWith(service).variables).toEqual({
      kind: "тест-api",
      name: ["users-list"],
    });
  });

  it("приехавшая запись становится записью склада, поля вида — её содержимым", async () => {
    serviceOf({
      presets: [
        {
          id: "запись-1",
          label: "Петстор",
          name: "petstore",
          kind: "тест-api",
          savedAt: "2026-09-21T10:00:00Z",
          endpoints: [{ id: "e1" }],
          groups: [{ id: "g1", name: "все" }],
          defs: null,
        },
      ],
    });

    const [preset] = await loadPresets(SHAPE);

    expect(preset).toEqual({
      id: "запись-1",
      kind: "тест-api",
      label: "Петстор",
      name: "petstore",
      savedAt: "2026-09-21T10:00:00Z",
      content: { endpoints: [{ id: "e1" }], groups: [{ id: "g1", name: "все" }] },
    });
  });

  it("форма вида приезжает аргументом — спрашиваются ровно её поля", async () => {
    const service = serviceOf({ presets: [] });

    await loadPresets({ kind: "шов", type: "Adapter", fields: ["root", "rules"] });
    const asked = askedWith(service);

    expect(asked.document).toContain("... on Adapter");
    expect(asked.document).toContain("rules");
    expect(asked.document).not.toContain("endpoints");
    expect(asked.variables).toEqual({ kind: "шов" });
  });
});

describe("запись в службу", () => {
  const fresh: Preset = {
    id: "наш-айди",
    kind: "тест-api",
    label: "Петстор",
    content: { endpoints: [] },
  };

  it("новая запись заводится с НАШИМ айди, содержимое едет целиком в state", async () => {
    const service = serviceOf({
      createPreset: { id: "наш-айди", savedAt: "2026-09-21T10:00:00Z" },
    });

    const saved = await savePreset(fresh);
    const asked = askedWith(service);

    expect(asked.document).toContain("createPreset");
    expect(asked.variables).toEqual({
      input: {
        id: "наш-айди",
        kind: "тест-api",
        label: "Петстор",
        state: { endpoints: [] },
      },
    });
    expect(saved.savedAt).toBe("2026-09-21T10:00:00Z");
  });

  it("уже уехавшая запись заменяется по айди, а не заводится второй раз", async () => {
    const service = serviceOf({
      replacePreset: { id: "наш-айди", savedAt: "2026-09-21T11:00:00Z" },
    });

    const saved = await savePreset({
      ...fresh,
      name: "petstore",
      savedAt: "2026-09-21T10:00:00Z",
    });
    const asked = askedWith(service);

    expect(asked.document).toContain("replacePreset");
    expect(asked.variables.id).toBe("наш-айди");
    expect(saved.savedAt).toBe("2026-09-21T11:00:00Z");
  });

  it("машинное имя едет, только когда оно есть", async () => {
    const service = serviceOf({ createPreset: { id: "наш-айди", savedAt: "когда-то" } });

    await savePreset(fresh);

    expect(askedWith(service).variables).toEqual({
      input: expect.not.objectContaining({ name: expect.anything() }),
    });
  });

  it("удаление зовёт службу по айди", async () => {
    const service = serviceOf({ deletePreset: true });

    expect(await dropPreset("наш-айди")).toBe(true);
    expect(askedWith(service).variables).toEqual({ id: "наш-айди" });
  });
});

describe("отказы", () => {
  it("отказ службы приезжает её же словами", () => {
    const failure = failureOf(
      new ClientError(
        {
          errors: [{ message: "имя занято в этом виде" }],
          status: 200,
          headers: new Headers(),
          body: "",
        } as unknown as ConstructorParameters<typeof ClientError>[0],
        { query: "mutation {}" },
      ),
    );

    expect(failure.reason).toBe("refused");
    expect(failure.message).toBe("имя занято в этом виде");
  });

  it("молчание сети — не отказ службы, и названо иначе", () => {
    const failure = failureOf(new TypeError("Failed to fetch"));

    expect(failure.reason).toBe("unreachable");
    expect(failure.message).toBe("Failed to fetch");
  });

  it("склад без клиента говорит об этом, а не притворяется оборванной сетью", async () => {
    connectPresets(undefined);

    const failure = await loadPresets(SHAPE).catch((error: unknown) => failureOf(error));

    expect(failure).toEqual({
      reason: "unconnected",
      message: expect.stringContaining("connectPresets"),
    });
  });
});
