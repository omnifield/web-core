import { run } from "@web-core/generators/mapping";

import { swagger2Template } from "./swagger/2.0";
import type { SchemaDocument } from "./types";

export const templates = [swagger2Template];

export async function parseSchema(raw: string): Promise<SchemaDocument> {
  return run(raw, templates);
}
