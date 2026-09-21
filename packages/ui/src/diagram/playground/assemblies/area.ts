import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const area: PassportAssembly<DiagramPart, string, Data> = {
  name: "area",
  means: "та же линия с заливкой до базовой — форму задаёт сборка, не данные",
  tree: {
    node: "root",
    props: { width: 360, height: 240, shape: "area" },
    bind: { data: "/data", series: "/series", axes: "/axes", insets: "/insets" },
  },
};
