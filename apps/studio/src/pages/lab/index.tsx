import { Show } from "@web-core/solid";
import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";

import { UI_CATALOGS } from "#/features/catalogs";
import { CatalogTree, useRouterCatalogTabs } from "#/widgets/catalogs";
import { ApiSetup } from "#/features/api-setup";
import { RailPanel } from "#/widgets/rail";
import {
  NavigationTabs,
  useRouterNavigationSelection,
} from "#/widgets/navigations";

const KITCHEN_ROUTE = "/lab/{-$component}/{-$feature}";

export function LabPage() {
  // Лаборатория показывает один каталог — компоненты, — поэтому маршрут назван только ему.
  const catalog = useRouterCatalogTabs(UI_CATALOGS, {
    components: KITCHEN_ROUTE,
  });
  const feature = useRouterNavigationSelection({
    param: "feature",
    to: KITCHEN_ROUTE,
  });

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <Show when={catalog.groups[0]}>
          {(group) => (
            <CatalogTree
              adapter={group().adapter}
              activeValue={group().activeValue}
              onSelect={group().onSelect}
            />
          )}
        </Show>
      </WorkspaceSidebar>
        <WorkspaceMain style={{ padding: 0 }}>
          <Outlet />
        </WorkspaceMain>
        <WorkspaceRightbar style={{ width: railVar("rail-lg"), padding: 0 }}>
          <NavigationTabs
            content={{
              api: () => (
                <RailPanel>
                  <ApiSetup />
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
