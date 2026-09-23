import { NavigationMenuLink as ArkLink } from "@ark-ui/solid/navigation-menu";
import type { JSX } from "solid-js";

import { dropAddress } from "../../../shared/utils/slot-chain";
import { traceLife } from "../../../shared/utils/trace";

export interface NavigationMenuLinkProps
  extends Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "onSelect"> {
  readonly value?: string;
  readonly current?: boolean;
  readonly closeOnClick?: boolean;
  readonly onSelect?: (event: CustomEvent) => void;
}

export function NavigationMenuLink(props: NavigationMenuLinkProps) {
  traceLife("ui.navigation-menu-link");

  return <ArkLink {...dropAddress(props)} />;
}
