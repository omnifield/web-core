import { NavigationMenuArrow as ArkArrow } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain";
import { traceLife } from "../../../shared/utils/trace";

export type NavigationMenuArrowProps = JSX.HTMLAttributes<HTMLDivElement>;

export function NavigationMenuArrow(props: NavigationMenuArrowProps) {
  traceLife("ui.navigation-menu-arrow");

  return <ArkArrow {...dropAddress(props)} />;
}
