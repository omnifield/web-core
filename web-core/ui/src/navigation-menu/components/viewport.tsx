import { NavigationMenuViewport as ArkViewport } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "@web-core/solid";

import { dropAddress } from "../../shared/utils/slot-chain";
import { traceLife } from "../../shared/utils/trace";

export type NavigationMenuViewportProps = JSX.HTMLAttributes<HTMLDivElement>;

export function NavigationMenuViewport(props: NavigationMenuViewportProps) {
  traceLife("ui.navigation-menu-viewport");

  return <ArkViewport {...dropAddress(props)} />;
}
