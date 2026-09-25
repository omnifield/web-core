import { defineEditorInfo } from "@web-core/skin/editor";

import { passport } from "../entity/passport";
import { assemblies } from "./assemblies/index";
import { parts } from "./parts";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@web-core/ui",
  genus: "component",
  group: "other",
  footprint: "regular",
  variantAxis: {
    means: "имя вида документа; его даёт человек в редакторе, кит пропускает насквозь",
  },
  parts,
  assemblies,
});
