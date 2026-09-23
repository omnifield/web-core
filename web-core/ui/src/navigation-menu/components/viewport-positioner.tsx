import { NavigationMenuViewportPositioner as ArkViewportPositioner } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";

export interface NavigationMenuViewportPositionerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly align?: "start" | "center" | "end";
}

export function NavigationMenuViewportPositioner(props: NavigationMenuViewportPositionerProps) {
  traceLife("ui.navigation-menu-viewport-positioner");

  return <ArkViewportPositioner {...dropAddress(props)} />;
}
