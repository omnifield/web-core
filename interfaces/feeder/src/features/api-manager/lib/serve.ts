import type { FieldRuleReport } from "@web-core/io";

import {
  adapterFor,
  asAdapter,
  ADAPTER_KIND,
  feed,
  type Adapter,
} from "../../../entities/adapter";
import type { InvokeResult, OpenapiEndpoint } from "../../../entities/openapi";
import { presetsStore } from "../../../entities/preset";
import { invokeEndpoint } from "./invoke";

export interface Serving {
  readonly result: InvokeResult;
  readonly data?: unknown;
  readonly report?: FieldRuleReport;
  readonly error?: string | null;
}

export interface Users {
  readonly provider: readonly string[];
  readonly consumer: readonly string[];
}

function adapterOf(users: Users): Adapter | undefined {
  const records = presetsStore.selectors
    .presetsOf(ADAPTER_KIND)
    .map((preset) => asAdapter(preset.content))
    .filter((one): one is Adapter => one !== undefined);

  return adapterFor(records, users.provider, users.consumer);
}

export async function serve(
  endpoint: OpenapiEndpoint,
  value: unknown,
  users: Users,
): Promise<Serving> {
  const result = await invokeEndpoint(endpoint, value);

  const adapter = adapterOf(users);
  if (adapter === undefined) return { result };

  const fed = feed(result.body, adapter);

  return { result, data: fed.value, report: fed.report, error: fed.error };
}
