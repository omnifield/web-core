import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io";
import { passport } from "../../entity/passport";
import { basic } from "./basic";
import { viewport } from "./viewport";

type NavigationMenuPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<NavigationMenuPart, string, Data>[] = [basic, viewport];
