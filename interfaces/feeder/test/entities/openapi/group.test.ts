import { describe, expect, it } from "vitest";

import {
  groupEndpoints,
  type EndpointDescriptor,
  type Group,
  type SchemaDocument,
} from "../../../src/entities/openapi";

let seq = 0;

function endpoint(url: string, groupId: string): EndpointDescriptor {
  seq += 1;
  return { id: `id-${seq}`, method: "GET", url, groupId, params: [] };
}

function document(
  endpoints: readonly EndpointDescriptor[],
  groups: readonly Group[] = [],
): SchemaDocument {
  return { endpoints, groups, defs: {} };
}

const pet: Group = { id: "g-pet", name: "pet" };
const store: Group = { id: "g-store", name: "store" };

describe("groupEndpoints", () => {
  it("собирает ручки одной группы вместе, имя берёт из записи группы", () => {
    const groups = groupEndpoints(
      document(
        [endpoint("/pet", pet.id), endpoint("/store", store.id), endpoint("/pet/{id}", pet.id)],
        [pet, store],
      ),
    );

    expect(groups.map((group) => group.name)).toEqual(["pet", "store"]);
    expect(groups[0]?.endpoints.map((item) => item.url)).toEqual(["/pet", "/pet/{id}"]);
  });

  it("порядок групп — реестр документа, а не порядок ручек", () => {
    const groups = groupEndpoints(
      document([endpoint("/store", store.id), endpoint("/pet", pet.id)], [pet, store]),
    );

    expect(groups.map((group) => group.name)).toEqual(["pet", "store"]);
  });

  it("группа без ручек живёт — у неё своя запись, она не производна", () => {
    const groups = groupEndpoints(document([], [pet]));

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ id: pet.id, name: "pet", endpoints: [] });
  });

  it("группа «unknown» — обычная запись реестра, а не особый случай перебора", () => {
    const unknown: Group = { id: "g-unknown", name: "unknown" };
    const groups = groupEndpoints(
      document(
        [endpoint("/loose", unknown.id), endpoint("/pet", pet.id), endpoint("/other", unknown.id)],
        [pet, unknown],
      ),
    );

    expect(groups.map((group) => group.name)).toEqual(["pet", "unknown"]);
    expect(groups[1]?.endpoints.map((item) => item.url)).toEqual(["/loose", "/other"]);
  });

  it("пустой документ даёт пустой список групп, а не группу-пустышку", () => {
    expect(groupEndpoints(document([]))).toEqual([]);
  });

  it("ни одна ручка не теряется и не двоится", () => {
    const endpoints = [
      endpoint("/a", pet.id),
      endpoint("/b", store.id),
      endpoint("/c", store.id),
      endpoint("/d", pet.id),
    ];

    const flat = groupEndpoints(document(endpoints, [pet, store])).flatMap(
      (group) => group.endpoints,
    );

    expect(flat).toHaveLength(endpoints.length);
    expect(new Set(flat.map((item) => item.url))).toEqual(
      new Set(endpoints.map((item) => item.url)),
    );
  });
});
