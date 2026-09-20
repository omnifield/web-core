import type { Adapter } from "./types";
import { usedBy } from "./used-by";

export function adapterFor<T extends Adapter>(
  records: readonly T[],
  provider: readonly string[],
  consumer: readonly string[],
): T | undefined {
  return records.find(
    (record) => usedBy(record, "providers", provider) && usedBy(record, "consumers", consumer),
  );
}
