import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const point: PassportAssembly<DiagramPart, string, Data> = {
  name: "point",
  means: "точки без соединяющей линии — рассеяние по тем же полям",
  tree: {
    node: "root",
    props: { width: 360, height: 240, shape: "point" },
    bind: { data: "/data", series: "/series", axes: "/axes", insets: "/insets" },
  },
};
