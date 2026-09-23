import { rules as styleCanon } from "../style/index.js";
import type { StyleCanonRule } from "../style/index.js";

/** Элемент `groups` у Biome: разделитель либо список matcher'ов — один список даёт один блок. */
type ImportGroupEntry = ":BLANK_LINE:" | readonly string[];

/** Объектная форма, а не булева `"on"`: плоская не принимает свои `groups`. */
interface OrganizeImportsOn {
  readonly level: "on";
  readonly options: { readonly groups: readonly ImportGroupEntry[] };
}

/** Ровно те секции `biome.json`, которые переводит канон кодстиля. Почему только они — FAQ.md. */
export interface BiomeConfig {
  readonly $schema: string;
  readonly formatter: {
    readonly enabled: boolean;
    readonly indentStyle: "space" | "tab";
    readonly indentWidth: number;
  };
  readonly assist: {
    readonly actions: { readonly source: { readonly organizeImports: OrganizeImportsOn | "off" } };
  };
  /** Явно `false` — без поля Biome включает свой `recommended`-набор. См. FAQ.md. */
  readonly linter: { readonly enabled: false };
}

const BIOME_SCHEMA = "https://biomejs.dev/schemas/2.5.4/schema.json";

/** Решение движка, не канона: дефолт Biome без этих полей — TABS. См. FAQ.md. */
const INDENT_STYLE = "space";
const INDENT_WIDTH = 2;

/** Голые имена → `@`-scoped → `#`-алиасы → относительные, без пустых строк. Разбор — FAQ.md. */
const IMPORT_GROUPS: readonly ImportGroupEntry[] = [
  [":NODE:", ":PACKAGE:", "!@*/**", "!#*/**"],
  ["@*/**"],
  ["#*/**"],
  [":PATH:"],
];

function isRequired(canonList: readonly StyleCanonRule[], id: string): boolean {
  return canonList.some((rule) => rule.id === id && rule.severity === "required");
}

/**
 * Переводит канон кодстиля в `biome.json`: `id` канона → включённая секция. Сам Biome этот
 * объект не читает — потребителю едет `dist/biome/biome.json`, см. FAQ.md.
 */
export function defineBiomeConfig(): BiomeConfig {
  return {
    $schema: BIOME_SCHEMA,
    formatter: {
      enabled: isRequired(styleCanon, "formatting"),
      indentStyle: INDENT_STYLE,
      indentWidth: INDENT_WIDTH,
    },
    assist: {
      actions: {
        source: {
          organizeImports: isRequired(styleCanon, "organized-imports")
            ? { level: "on", options: { groups: IMPORT_GROUPS } }
            : "off",
        },
      },
    },
    linter: { enabled: false },
  };
}
