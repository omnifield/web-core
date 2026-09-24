import type { PathType } from "@web-core/io";
import { describe, expect, it } from "vitest";

import { layoutOf } from "../../../src/entities/adapter";

describe("layoutOf", () => {
  it("корневые поля идут без заголовка", () => {
    const paths: PathType[] = [
      { path: "/label", type: "string" },
      { path: "/placeholder", type: "string" },
    ];

    expect(layoutOf(paths)).toEqual([
      { kind: "field", key: "/label", name: "label", path: "/label", type: "string", depth: 0 },
      {
        kind: "field",
        key: "/placeholder",
        name: "placeholder",
        path: "/placeholder",
        type: "string",
        depth: 0,
      },
    ]);
  });

  it("вложенные поля собираются под заголовком своего родителя", () => {
    const paths: PathType[] = [
      { path: "/author/name", type: "string" },
      { path: "/author/age", type: "number" },
    ];

    const rows = layoutOf(paths);

    expect(rows[0]).toMatchObject({ kind: "group", name: "author", repeated: false, depth: 0 });
    expect(rows[1]).toMatchObject({ kind: "field", name: "name", depth: 1 });
    expect(rows[2]).toMatchObject({ kind: "field", name: "age", depth: 1 });
  });

  it("индекс не показывается полем — он помечает группу как повторяющуюся", () => {
    const paths: PathType[] = [{ path: "/items/0/value", type: "string" }];

    const rows = layoutOf(paths);

    expect(rows[0]).toMatchObject({ kind: "group", name: "items", repeated: true });
    expect(rows[1]).toMatchObject({ kind: "field", name: "value", path: "/items/0/value", depth: 1 });
  });

  it("рекурсия читается как обычная вложенность, ступенька за ступенькой", () => {
    const paths: PathType[] = [
      { path: "/items/0/value", type: "string" },
      { path: "/items/0/children/0/value", type: "string" },
      { path: "/items/0/children/0/children", type: "recursive" },
    ];

    const rows = layoutOf(paths);

    expect(rows.map((row) => `${row.kind}:${row.name}:${row.depth}`)).toEqual([
      "group:items:0",
      "field:value:1",
      "group:children:1",
      "field:value:2",
      "field:children:2",
    ]);
  });

  it("заголовок не повторяется у второго поля той же группы", () => {
    const paths: PathType[] = [
      { path: "/items/0/value", type: "string" },
      { path: "/items/0/label", type: "string" },
    ];

    expect(layoutOf(paths).filter((row) => row.kind === "group")).toHaveLength(1);
  });

  it("путь остаётся при поле — он адрес, просто не для чтения", () => {
    const [, field] = layoutOf([{ path: "/items/0/label", type: "string" }]);

    expect(field).toMatchObject({ path: "/items/0/label", name: "label" });
  });
});
