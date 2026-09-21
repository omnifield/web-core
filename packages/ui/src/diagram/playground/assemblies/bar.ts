import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const bar: PassportAssembly<DiagramPart, string, Data> = {
  name: "bar",
  means: "столбцы по категориям — корень сам берёт категориальную шкалу под эту форму",
  tree: {
    node: "root",
    props: { shape: "bar" },
    bind: { data: "/data", series: "/series", axes: "/axes", insets: "/insets" },
  },
};
