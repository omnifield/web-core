import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";

import { tree } from "#/entities/component";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";
import { ApiConfiguration } from "#/features/lab-manager";
import { RailPanel } from "#/widgets/rail";
import {
  NavigationTabs,
  useRouterNavigationSelection,
} from "#/widgets/navigations";

const KITCHEN_ROUTE = "/lab/{-$component}/{-$feature}";

export function LabPage() {
  const selection = useRouterCatalogSelection(KITCHEN_ROUTE);
  const feature = useRouterNavigationSelection({
    param: "feature",
    to: KITCHEN_ROUTE,
  });

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={tree} {...selection} />
      </WorkspaceSidebar>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg"), padding: 0 }}>
        <NavigationTabs
          content={{
            api: () => (
              <RailPanel>
                <ApiConfiguration />
              </RailPanel>
            ),
          }}
          value={feature.value ?? ""}
          onValueChange={feature.onValueChange}
        />
      </WorkspaceRightbar>
    </Workspace>
  );
}
