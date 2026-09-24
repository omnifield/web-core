import { NavigationMenuContent as ArkContent } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../../shared/utils/slot-chain";
import { traceLife } from "../../../shared/utils/trace";

export interface NavigationMenuContentProps extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly value?: string;
}

export function NavigationMenuContent(props: NavigationMenuContentProps) {
  traceLife("ui.navigation-menu-content");

  return <ArkContent {...dropAddress(props)} />;
}
