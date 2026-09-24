import { NavigationMenuItem as ArkItem } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain";
import { traceLife } from "../../../shared/utils/trace";

export interface NavigationMenuItemProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly value: string;
  readonly disabled?: boolean;
}

export function NavigationMenuItem(props: NavigationMenuItemProps) {
  traceLife("ui.navigation-menu-item");

  return <ArkItem {...dropAddress(props)} />;
}
