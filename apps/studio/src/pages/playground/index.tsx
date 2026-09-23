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
  const groups = uiCatalog().map((catalog) => {
    const selection = useRouterCatalogSelection({
      param: "name",
      to: catalog.to,
    });

    return {
      value: catalog.value,
      label: catalog.label,
      adapter: catalog.items,
      get activeValue() {
        return selection.activeValue;
      },
      onSelect: selection.onSelect,
    };
  });

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md"), padding: 0 }}>
        <CatalogTrees groups={groups} />
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
