import { describe, expect, it } from "vitest";

import { adapterFor, usedBy, type Adapter } from "../../../src/entities/adapter";

const users: Adapter = {
  root: "",
  rules: [],
  providers: { api: { "preset-7": { "endpoint-3": {} } } },
  consumers: { component: { "user-card": {} } },
};

const other: Adapter = {
  root: "",
  rules: [],
  providers: { api: { "preset-9": { "endpoint-1": {} } } },
  consumers: { component: { table: {} } },
};

describe("usedBy", () => {
  it("лист по адресу — значит на этом проверяли", () => {
    expect(usedBy(users, "providers", ["api", "preset-7", "endpoint-3"])).toBe(true);
    expect(usedBy(users, "consumers", ["component", "user-card"])).toBe(true);
  });

  it("другая ручка того же пресета — не тот адрес", () => {
    expect(usedBy(users, "providers", ["api", "preset-7", "endpoint-9"])).toBe(false);
  });

  it("роли не смешиваются", () => {
    expect(usedBy(users, "consumers", ["api", "preset-7", "endpoint-3"])).toBe(false);
  });

  it("пустой адрес не значит «подходит любому»", () => {
    expect(usedBy(users, "providers", [])).toBe(false);
  });
});

describe("adapterFor", () => {
  it("находит запись, на которой проверяли обоих", () => {
    const found = adapterFor(
      [other, users],
      ["api", "preset-7", "endpoint-3"],
      ["component", "user-card"],
    );

    expect(found).toBe(users);
  });

  it("совпадения одной стороны мало", () => {
    const found = adapterFor(
      [users],
      ["api", "preset-7", "endpoint-3"],
      ["component", "table"],
    );

    expect(found).toBeUndefined();
  });
});
