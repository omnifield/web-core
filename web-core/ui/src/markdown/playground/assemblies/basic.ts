import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io";
import type { passport } from "../../entity/passport";

type MarkdownPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const basic: PassportAssembly<MarkdownPart, string, Data> = {
  name: "basic",
  means: "документ из данных: части растит сам текст, дерева схемы под них нет",
  tree: { node: "root", bind: { text: "/text" } },
};
