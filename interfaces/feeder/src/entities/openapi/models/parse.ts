import { run } from "@web-core/generators/mapping";

import { identify } from "./edit";
import { swagger2Template } from "./swagger/2.0";
import type { SchemaDocument } from "./types";

export const templates = [swagger2Template];

export async function parseSchema(raw: string): Promise<SchemaDocument> {
  return identify(await run(raw, templates));
}
