import { ADAPTER_KIND } from "./kind";

export const ADAPTER_SHAPE = {
  kind: ADAPTER_KIND,
  type: "Adapter",
  fields: ["root", "rules", "extra", "providers", "consumers"],
} as const;
