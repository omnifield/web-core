import { NavigationMenuList as ArkList } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";

export type NavigationMenuListProps = JSX.HTMLAttributes<HTMLDivElement>;

export function NavigationMenuList(props: NavigationMenuListProps) {
  traceLife("ui.navigation-menu-list");

  return <ArkList {...dropAddress(props)} />;
}
