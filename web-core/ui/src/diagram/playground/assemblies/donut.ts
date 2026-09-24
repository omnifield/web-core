import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const donut: PassportAssembly<DiagramPart, string, Data> = {
  name: "donut",
  means: "тот же круг с дыркой в центре — доля читается кольцом, середина остаётся под подпись",
  tree: {
    node: "root",
    props: { shape: "pie", innerRatio: 0.6 },
    bind: { data: "/data", series: "/series", axes: "/axes", insets: "/insets" },
  },
};
