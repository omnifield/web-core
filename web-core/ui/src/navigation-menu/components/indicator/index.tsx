import { NavigationMenuIndicator as ArkIndicator } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain";
import { traceLife } from "../../../shared/utils/trace";

export type NavigationMenuIndicatorProps = JSX.HTMLAttributes<HTMLDivElement>;

export function NavigationMenuIndicator(props: NavigationMenuIndicatorProps) {
  traceLife("ui.navigation-menu-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}
