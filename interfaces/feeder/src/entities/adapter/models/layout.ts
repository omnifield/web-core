import { segmentsOf, type PathType } from "@web-core/io";

export interface LayoutGroup {
  readonly kind: "group";
  readonly key: string;
  readonly name: string;
  readonly repeated: boolean;
  readonly depth: number;
}

export interface LayoutField {
  readonly kind: "field";
  readonly key: string;
  readonly name: string;
  readonly path: string;
  readonly type: string;
  readonly depth: number;
}

export type LayoutRow = LayoutGroup | LayoutField;

const isIndex = (segment: string) => /^\d+$/.test(segment);

export function layoutOf(paths: readonly PathType[]): LayoutRow[] {
  const rows: LayoutRow[] = [];
  const opened = new Set<string>();

  for (const { path, type } of paths) {
    const segments = segmentsOf(path);
    const name = segments.at(-1) ?? path;

    let depth = 0;
    let key = "";

    for (const [at, segment] of segments.slice(0, -1).entries()) {
      if (isIndex(segment)) continue;

      key += `/${segment}`;
      if (!opened.has(key)) {
        opened.add(key);
        rows.push({
          kind: "group",
          key,
          name: segment,
          repeated: isIndex(segments[at + 1] ?? ""),
          depth,
        });
      }

      depth += 1;
    }

    rows.push({ kind: "field", key: path, name, path, type, depth });
  }

  return rows;
}
