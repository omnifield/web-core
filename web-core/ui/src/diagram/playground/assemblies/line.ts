import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const line: PassportAssembly<DiagramPart, string, Data> = {
  name: "line",
  means: "линия по значениям — те же данные, что у остальных сборок, другая форма",
  tree: {
    node: "root",
    props: { shape: "line" },
    bind: { data: "/data", series: "/series", axes: "/axes", insets: "/insets" },
  },
};
