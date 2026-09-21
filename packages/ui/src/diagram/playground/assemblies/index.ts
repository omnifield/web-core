import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io.js";
import type { passport } from "../../entity/passport.js";
import { area } from "./area.js";
import { bar } from "./bar.js";
import { barHorizontal } from "./bar-horizontal.js";
import { donut } from "./donut.js";
import { line } from "./line.js";
import { pie } from "./pie.js";
import { point } from "./point.js";

type DiagramPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<DiagramPart, string, Data>[] = [line, area, bar, barHorizontal, point, pie, donut];
