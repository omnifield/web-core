import { parser } from "@web-core/build-fixture-dep";

export function NestedCjs() {
  return <p data-testid="nested-cjs">{typeof parser}</p>;
}
