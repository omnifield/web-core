import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { passport } from "../entity/passport";

type MarkdownPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

// Части документа собирает сам текст, поэтому `accepts` у них пустой: положить внутрь через
// схему нечего — место уже занято тем, что нашлось в разметке источника.
export const parts: Readonly<Record<MarkdownPart, PassportPartEditorInfo<MarkdownPart>>> = {
  root: {
    means: "документ целиком: текст разбирается на части, каждая со своим адресом для скина",
    accepts: [],
  },
  heading: {
    means: "заголовок раздела; уровень приносит сам документ, а не редактор",
    states: {
      "level-1": { means: "заголовок первого уровня — один на документ" },
      "level-2": { means: "заголовок второго уровня — раздел" },
      "level-3": { means: "заголовок третьего уровня — подраздел" },
      "level-4": { means: "заголовок четвёртого уровня" },
      "level-5": { means: "заголовок пятого уровня" },
      "level-6": { means: "заголовок шестого уровня — самый мелкий" },
    },
    accepts: [],
  },
  paragraph: {
    means: "абзац текста — основной объём документа",
    accepts: [],
  },
  list: {
    means: "список пунктов, маркированный или нумерованный",
    states: {
      ordered: { means: "нумерованный список — порядок пунктов значим" },
    },
    accepts: [],
  },
  code: {
    means: "код: блоком между строками либо внутри строки текста",
    states: {
      inline: { means: "код внутри строки текста, а не отдельным блоком" },
    },
    accepts: [],
  },
  table: {
    means: "таблица документа — шапка и строки из разметки источника",
    accepts: [],
  },
  quote: {
    means: "цитата — выделенный кусок чужого текста внутри документа",
    accepts: [],
  },
  link: {
    means: "ссылка; адрес берётся из документа как есть",
    states: {
      hover: { means: "курсор над ссылкой" },
      "focus-visible": { means: "ссылка получила фокус с клавиатуры" },
    },
    accepts: [],
  },
};
