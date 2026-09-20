import { asAdapter, ADAPTER_KIND, type Adapter } from "../../../entities/adapter";
import { recordsOf, type Record } from "../../../entities/preset";

export function savedAdapters(): Record<Adapter>[] {
  return recordsOf(ADAPTER_KIND, asAdapter);
}
