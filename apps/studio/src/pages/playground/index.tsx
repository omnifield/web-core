import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { uiCatalog } from "#/features/catalogs";
import { CatalogTrees, useRouterCatalogSelection } from "#/widgets/catalogs";

export function PlaygroundPage() {
  const selection = useRouterCatalogSelection("/showcase/{-$component}");

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md"), padding: 0 }}>
        <CatalogTrees
          groups={uiCatalog().map((catalog) => ({
            value: catalog.value,
            label: catalog.label,
            adapter: catalog.items,
            activeValue: selection.activeValue,
            onSelect: selection.onSelect,
          }))}
        />
      </WorkspaceSidebar>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }}>
        w
      </WorkspaceRightbar>
    </Workspace>
  );
}
