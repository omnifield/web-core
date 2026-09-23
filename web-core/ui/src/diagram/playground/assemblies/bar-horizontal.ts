import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const barHorizontal: PassportAssembly<DiagramPart, string, Data> = {
  name: "bar-horizontal",
  means: "те же столбцы, лежащие на боку: категории по вертикали, значения по горизонтали",
  tree: {
    node: "root",
    props: { shape: "bar-horizontal" },
    bind: { data: "/data", series: "/series", axes: "/axes", insets: "/insets" },
  },
};
