import type { PassportAssembly } from "@web-core/skin/editor";
import { Json } from "./json";

export function Assembly(props: { assembly: PassportAssembly }) {
  return <Json data={props.assembly} />;
}
