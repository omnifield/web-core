import type { EndpointGroup } from "../group";
import type { GroupConfig } from "./types";

export function groupConfigOf(group: EndpointGroup): GroupConfig {
  return { name: group.name };
}
