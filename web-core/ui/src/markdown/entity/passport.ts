import { defineSettings, definePassport, type PassportState } from "@web-core/skin/model";

import type { MarkdownProps } from "../components/index";
import { anatomy } from "./anatomy";

// Уровень заголовка приносит сам разборщик документа — кит перекладывает его в метку.
const levels: readonly PassportState[] = [1, 2, 3, 4, 5, 6].map((level) => ({
  name: `level-${level}`,
  mark: { kind: "attribute", name: "data-level", value: String(level) },
}));

export const passport = definePassport({
  anatomy,
  root: "root",
  parts: [
    { name: "root", states: [] },
    { name: "heading", states: levels },
    { name: "paragraph", states: [] },
    { name: "list", states: [{ name: "ordered", mark: { kind: "attribute", name: "data-ordered" } }] },
    { name: "code", states: [{ name: "inline", mark: { kind: "attribute", name: "data-inline" } }] },
    { name: "table", states: [] },
    { name: "quote", states: [] },
    {
      name: "link",
      states: [
        { name: "hover", mark: { kind: "pseudo", name: ":hover" } },
        { name: "focus-visible", mark: { kind: "pseudo", name: ":focus-visible" } },
      ],
    },
  ],
  variantAxis: {
    mark: { kind: "attribute", name: "data-variant" },
  },
  settings: defineSettings<MarkdownProps>()({}),
});
