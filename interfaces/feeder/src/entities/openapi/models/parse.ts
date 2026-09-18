import { run } from "@web-core/generators/mapping";

import { swagger2Template } from "./swagger/2.0";
import type { OpenapiEndpoint } from "./types";

export const templates = [swagger2Template];

export async function parseEndpoints(raw: string): Promise<readonly OpenapiEndpoint[]> {
  return run(raw, templates);
}
