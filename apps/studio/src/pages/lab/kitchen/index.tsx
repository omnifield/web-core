import { Mastering } from "@web-core/feeder";
import type { FieldRule, PathType } from "@web-core/io";

import { createSignal } from "@web-core/solid";

const output: PathType[] = [
  { path: "/title", type: "string" },
  { path: "/author/name", type: "string" },
  { path: "/author/age", type: "number" },
  { path: "/rows/0/label", type: "string" },
  { path: "/rows/0/value", type: "number" },
  { path: "/kind", type: "enum" },
];

const input: PathType[] = [
  { path: "/total", type: "number" },
  { path: "/data/0/id", type: "number" },
  { path: "/data/0/login", type: "string" },
  { path: "/data/0/profile/city", type: "string" },
  { path: "/data/0/active", type: "boolean" },
];
export function KitchenPage() {
  const [rules, setRules] = createSignal<FieldRule[]>([]);
  return (
    <Mastering
      output={output}
      input={input}
      rules={rules()}
      onLink={(link) =>
        setRules((was) => [
          ...was.filter((r) => r.target !== link.target),
          link,
        ])
      }
    />
  );
}
