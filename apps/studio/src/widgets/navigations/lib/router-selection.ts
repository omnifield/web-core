import { useRouteParamSelection } from "@web-core/router";
import type { TabsProps } from "@web-core/ui";

export function useRouterNavigationSelection(options: {
  param: string;
  to: string;
  defaultValue?: string;
}) {
  const selection = useRouteParamSelection(options.param, options.to, {
    defaultValue: options.defaultValue,
  });

  return {
    get value() {
      return selection.value;
    },
    onValueChange(
      details: Parameters<NonNullable<TabsProps["onValueChange"]>>[0],
    ) {
      selection.select(details.value);
    },
  };
}
