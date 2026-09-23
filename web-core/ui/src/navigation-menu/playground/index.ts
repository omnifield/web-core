import { defineEditorInfo } from "@web-core/skin/editor";
import { passport } from "../entity/passport";
import { assemblies } from "./assemblies";
import { parts } from "./parts";
import { settings } from "./settings";

export const editorInfo = /*@__PURE__*/ defineEditorInfo(passport, {
  package: "@web-core/ui",
  genus: "component",
  group: "navigation",
  footprint: "wide",
  variantAxis: {
    means: "имя вида, которое человек даёт меню в редакторе; кит пропускает его насквозь",
  },
  parts,
  settings,
  assemblies,
});
