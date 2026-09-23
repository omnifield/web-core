import { NavigationMenuItemIndicator as ArkItemIndicator } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain";
import { traceLife } from "../../../shared/utils/trace";

export type NavigationMenuItemIndicatorProps = JSX.HTMLAttributes<HTMLDivElement>;

export function NavigationMenuItemIndicator(props: NavigationMenuItemIndicatorProps) {
  traceLife("ui.navigation-menu-item-indicator");

  return <ArkItemIndicator {...dropAddress(props)} />;
}
