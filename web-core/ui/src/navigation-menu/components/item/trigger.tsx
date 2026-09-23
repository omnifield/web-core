import { NavigationMenuTrigger as ArkTrigger } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain";
import { traceLife } from "../../../shared/utils/trace";

export type NavigationMenuTriggerProps = JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export function NavigationMenuTrigger(props: NavigationMenuTriggerProps) {
  traceLife("ui.navigation-menu-trigger");

  return <ArkTrigger {...dropAddress(props)} />;
}
