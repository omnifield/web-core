export { NavigationMenu, type NavigationMenuProps } from "./root";
export { NavigationMenuList, type NavigationMenuListProps } from "./list";
export { NavigationMenuItem, type NavigationMenuItemProps } from "./item";
export { NavigationMenuTrigger, type NavigationMenuTriggerProps } from "./item/trigger";
export {
  NavigationMenuItemIndicator,
  type NavigationMenuItemIndicatorProps,
} from "./item/indicator";
export { NavigationMenuContent, type NavigationMenuContentProps } from "./item/content";
export { NavigationMenuLink, type NavigationMenuLinkProps } from "./item/link";
export { NavigationMenuIndicator, type NavigationMenuIndicatorProps } from "./indicator";
export { NavigationMenuArrow, type NavigationMenuArrowProps } from "./indicator/arrow";
export {
  NavigationMenuViewportPositioner,
  type NavigationMenuViewportPositionerProps,
} from "./viewport-positioner";
export { NavigationMenuViewport, type NavigationMenuViewportProps } from "./viewport";

import { defineKitComponent } from "../../kit-form";
import { passport } from "../entity/passport";
import { NavigationMenu } from "./root";
import { NavigationMenuList } from "./list";
import { NavigationMenuItem } from "./item";
import { NavigationMenuTrigger } from "./item/trigger";
import { NavigationMenuItemIndicator } from "./item/indicator";
import { NavigationMenuContent } from "./item/content";
import { NavigationMenuLink } from "./item/link";
import { NavigationMenuIndicator } from "./indicator";
import { NavigationMenuArrow } from "./indicator/arrow";
import { NavigationMenuViewportPositioner } from "./viewport-positioner";
import { NavigationMenuViewport } from "./viewport";

export const kit = defineKitComponent(passport, {
  root: NavigationMenu,
  list: NavigationMenuList,
  item: NavigationMenuItem,
  trigger: NavigationMenuTrigger,
  itemIndicator: NavigationMenuItemIndicator,
  content: NavigationMenuContent,
  link: NavigationMenuLink,
  indicator: NavigationMenuIndicator,
  arrow: NavigationMenuArrow,
  viewportPositioner: NavigationMenuViewportPositioner,
  viewport: NavigationMenuViewport,
});
