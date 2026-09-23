import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { componentsTree } from "#/entities/component";
import { catalogs } from "#/features/catalogs";
import { CatalogTree, useRouterCatalogSelection } from "#/widgets/catalogs";

export function PlaygroundPage() {
  const selection = useRouterCatalogSelection("/showcase/{-$component}");

  console.log(
    "каталоги плейграунда",
    catalogs().map((catalog) => ({
      value: catalog.value,
      label: catalog.label,
      items: catalog.items(),
    })),
  );

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md") }}>
        <CatalogTree adapter={componentsTree} {...selection} />
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
