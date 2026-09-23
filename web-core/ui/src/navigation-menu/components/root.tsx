import { NavigationMenuRoot as ArkRoot } from "@ark-ui/solid/navigation-menu";
import { splitProps, type JSX } from "solid-js";

import { dropAddress } from "../../shared/utils/slot-chain";
import { useKitLife } from "../../shared/utils/skin-life";
import { passport } from "../entity/passport";

export interface NavigationMenuProps extends JSX.HTMLAttributes<HTMLElement> {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly orientation?: "horizontal" | "vertical";
  readonly openDelay?: number;
  readonly closeDelay?: number;
  readonly disableClickTrigger?: boolean;
  readonly disableHoverTrigger?: boolean;
  readonly disablePointerLeaveClose?: boolean;
  readonly lazyMount?: boolean;
  readonly unmountOnExit?: boolean;
  readonly onValueChange?: (value: string) => void;
}

export function NavigationMenu(props: NavigationMenuProps) {
  useKitLife(passport, props);

  const [own, rest] = splitProps(dropAddress(props), ["onValueChange"]);

  return <ArkRoot {...rest} onValueChange={(details) => own.onValueChange?.(details.value)} />;
}
