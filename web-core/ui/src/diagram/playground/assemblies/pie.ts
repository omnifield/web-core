import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const pie: PassportAssembly<DiagramPart, string, Data> = {
  name: "pie",
  means: "круговая диаграмма: доля каждой записи в сумме серии, осей и сетки у неё нет",
  tree: {
    node: "root",
    props: { shape: "pie" },
    bind: { data: "/data", series: "/series", axes: "/axes", insets: "/insets" },
  },
};
