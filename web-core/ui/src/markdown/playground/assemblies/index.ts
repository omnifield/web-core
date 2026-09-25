import type { PassportAssembly } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";

import type { Data } from "../../entity/io";
import type { passport } from "../../entity/passport";
import { basic } from "./basic";

type MarkdownPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<MarkdownPart, string, Data>[] = [basic];
