import { Outlet } from "@web-core/router";
import { railVar } from "@web-core/skin";
import {
  Workspace,
  WorkspaceMain,
  WorkspaceRightbar,
  WorkspaceSidebar,
} from "@web-core/ui";
import { UI_CATALOGS } from "#/features/catalogs";
import { CatalogTrees, useRouterCatalogTabs } from "#/widgets/catalogs";

export function PlaygroundPage() {
  // Своих веток у песочницы нет — выбор пункта уводит в витрину, и теперь это видно на месте
  // вызова, а не спрятано внутри каталога.
  const catalog = useRouterCatalogTabs(UI_CATALOGS, {
    components: "/showcase/component/{-$component}",
    modules: "/showcase/module/{-$module}",
  });

  return (
    <Workspace data-variant="multi-column" outlined>
      <WorkspaceSidebar style={{ width: railVar("rail-md"), padding: 0 }}>
        <CatalogTrees
          value={catalog.tab()}
          onValueChange={(details) => catalog.openTab(details.value)}
          groups={catalog.groups}
        />
      </WorkspaceSidebar>
      <WorkspaceMain style={{ padding: 0 }}>
        <Outlet />
      </WorkspaceMain>
      <WorkspaceRightbar style={{ width: railVar("rail-lg") }} />
    </Workspace>
  );
}
