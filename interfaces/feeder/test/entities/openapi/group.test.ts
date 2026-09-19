import { describe, expect, it } from "vitest";

import {
  groupEndpoints,
  NO_TAG,
  type EndpointDescriptor,
} from "../../../src/entities/openapi";

let seq = 0;

function endpoint(url: string, tag?: string): EndpointDescriptor {
  seq += 1;
  return { id: `id-${seq}`, method: "GET", url, tag, params: [] };
}

describe("groupEndpoints", () => {
  it("собирает ручки одного тега в одну группу", () => {
    const groups = groupEndpoints([
      endpoint("/pet", "pet"),
      endpoint("/store", "store"),
      endpoint("/pet/{id}", "pet"),
    ]);

    expect(groups.map((group) => group.tag)).toEqual(["pet", "store"]);
    expect(groups[0]?.endpoints.map((item) => item.url)).toEqual(["/pet", "/pet/{id}"]);
  });

  it("порядок групп — по первому появлению тега, а не алфавитный", () => {
    const groups = groupEndpoints([
      endpoint("/store", "store"),
      endpoint("/pet", "pet"),
    ]);

    expect(groups.map((group) => group.tag)).toEqual(["store", "pet"]);
  });

  it("ручки без тега — своя группа, и она идёт последней", () => {
    const groups = groupEndpoints([
      endpoint("/loose"),
      endpoint("/pet", "pet"),
      endpoint("/other"),
    ]);

    expect(groups.map((group) => group.tag)).toEqual(["pet", NO_TAG]);
    expect(groups[1]?.endpoints.map((item) => item.url)).toEqual(["/loose", "/other"]);
  });

  it("пустой каталог даёт пустой список групп, а не группу-пустышку", () => {
    expect(groupEndpoints([])).toEqual([]);
  });

  it("ни одна ручка не теряется и не двоится", () => {
    const endpoints = [
      endpoint("/a", "one"),
      endpoint("/b"),
      endpoint("/c", "two"),
      endpoint("/d", "one"),
    ];

    const flat = groupEndpoints(endpoints).flatMap((group) => group.endpoints);

    expect(flat).toHaveLength(endpoints.length);
    expect(new Set(flat.map((item) => item.url))).toEqual(
      new Set(endpoints.map((item) => item.url)),
    );
  });
});
